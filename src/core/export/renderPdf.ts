import { pdf } from "@react-pdf/renderer";
import type { ImageAsset, Language, Project } from "../../types/project";
import { ProjectPdfDocument, SinglePagePdfDocument } from "./pdfDocument";

export async function renderProjectPdf(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  options?: { draft?: boolean },
): Promise<Blob> {
  return pdf(ProjectPdfDocument({ project, images, language, draft: options?.draft })).toBlob();
}

export async function renderSinglePagePdf(
  project: Project,
  images: Map<string, ImageAsset>,
  pageId: string,
): Promise<Blob> {
  return pdf(SinglePagePdfDocument({ project, images, pageId })).toBlob();
}

export function pdfFilename(project: Project, language: Language): string {
  return `${slugify(project.projectMeta.title)}-${language}.pdf`;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}
