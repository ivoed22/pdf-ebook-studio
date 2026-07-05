import JSZip from "jszip";
import { importMarkdown } from "../markdown/importer";
import { importProjectJson, type ImportedProject } from "../export/projectJson";
import { guessMime, isSupportedImageFilename, normalizeFilename } from "../assets/imageStore";
import type { ImageAsset } from "../../types/project";

interface AgentPackManifest {
  format?: string;
  version?: number;
  primaryImport?: string;
  fallbackMarkdown?: string;
  imagesFolder?: string;
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
    images.push({
      filename,
      type: guessMime(filename),
      size: blob.size,
      blob: new Blob([blob], { type: guessMime(filename) }),
    });
  }

  return images;
}

export async function importAgentPack(file: File): Promise<ImportedProject> {
  const zip = await JSZip.loadAsync(file);
  const manifestText = await textFile(zip, "manifest.json");
  const manifest: AgentPackManifest = manifestText ? JSON.parse(manifestText) : {};

  if (manifest.format && manifest.format !== "pdf-ebook-studio-agent-pack") {
    throw new Error(`Unsupported agent pack format "${manifest.format}".`);
  }

  const primaryPath = findFile(zip, manifest.primaryImport, [
    "project/project-with-images.json",
    "project/project.json",
  ]);
  if (primaryPath) {
    const imported = importProjectJson((await textFile(zip, primaryPath)) || "");
    if (imported.images.length) return imported;

    const folderImages = await imagesFromFolder(zip, manifest.imagesFolder);
    return {
      ...imported,
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
  if (!images.length) warnings.push("Agent pack imported without images — add an images/ folder or embedded JSON images.");

  return { project, images, warnings };
}
