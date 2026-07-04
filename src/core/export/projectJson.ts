import { saveAs } from "file-saver";
import { ProjectSchema, newId, type ImageAsset, type Project } from "../../types/project";
import { guessMime } from "../assets/imageStore";
import { slugify } from "./renderPdf";

interface PortableProject {
  format: "pdf-ebook-studio-project";
  version: 1;
  project: Project;
  /** filename -> base64 data (optional, for portable exports) */
  images?: Record<string, string>;
}

export async function exportProjectJson(
  project: Project,
  images: Map<string, ImageAsset>,
  includeImages: boolean,
): Promise<void> {
  const payload: PortableProject = {
    format: "pdf-ebook-studio-project",
    version: 1,
    project,
  };
  if (includeImages) {
    payload.images = {};
    for (const [filename, asset] of images) {
      payload.images[filename] = await blobToBase64(asset.blob);
    }
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  saveAs(blob, `${slugify(project.projectMeta.title)}-project.json`);
}

export interface ImportedProject {
  project: Project;
  images: ImageAsset[];
  warnings: string[];
}

export function importProjectJson(jsonText: string): ImportedProject {
  const warnings: string[] = [];
  const raw = JSON.parse(jsonText) as Partial<PortableProject> | Project;

  const projectData: unknown =
    (raw as PortableProject).format === "pdf-ebook-studio-project"
      ? (raw as PortableProject).project
      : raw;

  const parsed = ProjectSchema.safeParse(projectData);
  if (!parsed.success) {
    throw new Error(
      "This file is not a valid PDF Ebook Studio project: " +
        parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
    );
  }
  const project = parsed.data;
  // New identity so an import never overwrites an existing project silently.
  project.id = newId();
  project.updatedAt = new Date().toISOString();

  const images: ImageAsset[] = [];
  const embedded = (raw as PortableProject).images;
  if (embedded) {
    for (const [filename, base64] of Object.entries(embedded)) {
      try {
        images.push({
          filename,
          type: guessMime(filename),
          size: 0,
          blob: base64ToBlob(base64, guessMime(filename)),
        });
      } catch {
        warnings.push(`Embedded image "${filename}" could not be decoded and was skipped.`);
      }
    }
  } else {
    warnings.push("Project imported without images — upload the image files again to match by filename.");
  }
  return { project, images, warnings };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}
