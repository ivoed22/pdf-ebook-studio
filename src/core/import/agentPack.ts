import JSZip from "jszip";
import { importMarkdown } from "../markdown/importer";
import { importProjectJson, type ImportedProject } from "../export/projectJson";
import { guessMime, imageDimensions, isSupportedImageFilename, normalizeFilename } from "../assets/imageStore";
import type { ImageAsset } from "../../types/project";
import { ProductionPlanSchema, type ProductionPlan } from "../../types/project";

interface AgentPackManifest {
  format?: string;
  version?: number;
  primaryImport?: string;
  fallbackMarkdown?: string;
  imagesFolder?: string;
  qcStatus?: "needs-images" | "pass";
}

export interface AgentPackImportResult extends ImportedProject {
  manifest: AgentPackManifest;
  productionPlan?: ProductionPlan;
}

function textFile(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path);
  return entry ? entry.async("text") : Promise.resolve(null);
}

function normalizeZipPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function findFile(zip: JSZip, preferred: string | undefined, fallbacks: string[]): string | undefined {
  const candidates = [preferred, ...fallbacks].filter((p): p is string => Boolean(p));
  const files = new Set(Object.values(zip.files).filter((f) => !f.dir).map((f) => normalizeZipPath(f.name)));
  return candidates.map(normalizeZipPath).find((p) => files.has(p));
}

async function imagesFromFolder(zip: JSZip, folder: string | undefined): Promise<ImageAsset[]> {
  const prefix = normalizeZipPath(folder || "images/");
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const images: ImageAsset[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const path = normalizeZipPath(entry.name);
    if (!path.startsWith(normalizedPrefix)) continue;

    const filename = normalizeFilename(path);
    if (filename.startsWith("._") || filename.startsWith(".")) continue;
    if (!isSupportedImageFilename(filename)) continue;

    const blob = await entry.async("blob");
    const typedBlob = new Blob([blob], { type: guessMime(filename) });
    images.push({
      filename,
      type: guessMime(filename),
      size: blob.size,
      blob: typedBlob,
      ...(await imageDimensions(typedBlob)),
    });
  }

  return images;
}

async function productionFromZip(zip: JSZip, manifest: AgentPackManifest): Promise<ProductionPlan | undefined> {
  const json = await textFile(zip, "prompts/image-prompts.json");
  const markdown = await textFile(zip, "prompts/chatgpt-image-batches.md");
  if (!json && !markdown) return undefined;
  if (!json) return { qcStatus: manifest.qcStatus ?? "needs-images", images: [], batches: [], sourceMarkdown: markdown ?? undefined };
  const raw = JSON.parse(json);
  const candidate = Array.isArray(raw) ? { images: raw, batches: [] } : raw;
  return ProductionPlanSchema.parse({ ...candidate, qcStatus: candidate.qcStatus ?? manifest.qcStatus ?? "needs-images", sourceMarkdown: markdown ?? candidate.sourceMarkdown });
}

function syncProduction(plan: ProductionPlan | undefined, images: ImageAsset[]): void {
  if (!plan) return;
  const uploaded = new Set(images.map((image) => image.filename));
  for (const record of plan.images) if (uploaded.has(record.filename) && record.status === "planned") record.status = "uploaded";
}

export async function importAgentPack(file: File): Promise<AgentPackImportResult> {
  const zip = await JSZip.loadAsync(file);
  const manifestText = await textFile(zip, "manifest.json");
  const manifest: AgentPackManifest = manifestText ? JSON.parse(manifestText) : {};
  const productionPlan = await productionFromZip(zip, manifest);

  if (manifest.format && manifest.format !== "pdf-ebook-studio-agent-pack") {
    throw new Error(`Unsupported agent pack format "${manifest.format}".`);
  }

  const primaryPath = findFile(zip, manifest.primaryImport, [
    "project/project-with-images.json",
    "project/project.json",
  ]);
  if (primaryPath) {
    const imported = importProjectJson((await textFile(zip, primaryPath)) || "");
    if (productionPlan) imported.project.production = productionPlan;
    syncProduction(productionPlan, imported.images);
    if (imported.images.length) return { ...imported, manifest, productionPlan };

    const folderImages = await imagesFromFolder(zip, manifest.imagesFolder);
    syncProduction(productionPlan, folderImages);
    return {
      ...imported,
      manifest,
      productionPlan,
      images: folderImages,
      warnings:
        folderImages.length > 0
          ? imported.warnings.filter((w) => !w.includes("Project imported without images"))
          : imported.warnings,
    };
  }

  const markdownPath = findFile(zip, manifest.fallbackMarkdown, ["project/project.md"]);
  if (!markdownPath) {
    throw new Error("Agent pack is missing project/project-with-images.json and project/project.md.");
  }

  const { project, warnings } = importMarkdown((await textFile(zip, markdownPath)) || "");
  const images = await imagesFromFolder(zip, manifest.imagesFolder);
  syncProduction(productionPlan, images);
  if (!images.length) warnings.push("Agent pack imported without images — add an images/ folder or embedded JSON images.");

  if (productionPlan) project.production = productionPlan;
  return { project, images, warnings, manifest, productionPlan };
}
