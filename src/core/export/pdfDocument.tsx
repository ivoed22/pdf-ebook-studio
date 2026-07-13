import { Document } from "@react-pdf/renderer";
import type { ImageAsset, Language, Project } from "../../types/project";
import { resolveProjectTheme } from "../../data/themes/themes";
import { tokensFor } from "../../pdf/theme";
import { registerFonts } from "../../pdf/fonts";
import { renderPage } from "../../pdf/renderers";
import { imageUrl } from "../assets/imageStore";
import type { RenderContext } from "../../pdf/components";

export function buildRenderContext(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  draft = false,
): { ctx: RenderContext; pages: Project["pages"] } {
  registerFonts();
  const pages = project.pages
    .filter((p) => p.language === language)
    .sort((a, b) => a.pageNumber - b.pageNumber);
  const imageUrls = new Map<string, string>();
  for (const asset of images.values()) imageUrls.set(asset.filename, imageUrl(asset));
  const ctx: RenderContext = {
    tokens: tokensFor(resolveProjectTheme(project)),
    project,
    imageUrls,
    pageCount: pages.length,
    draft,
  };
  return { ctx, pages };
}

export function ProjectPdfDocument({
  project,
  images,
  language,
  draft = false,
}: {
  project: Project;
  images: Map<string, ImageAsset>;
  language: Language;
  draft?: boolean;
}) {
  const { ctx, pages } = buildRenderContext(project, images, language, draft);
  return (
    <Document
      title={`${project.projectMeta.title} (${language.toUpperCase()})`}
      author={project.projectMeta.author}
      creator="PDF Ebook Studio"
    >
      {pages.map((page) => renderPage(ctx, page))}
    </Document>
  );
}

/** Single-page document used by the live preview. */
export function SinglePagePdfDocument({
  project,
  images,
  pageId,
}: {
  project: Project;
  images: Map<string, ImageAsset>;
  pageId: string;
}) {
  const page = project.pages.find((p) => p.id === pageId);
  if (!page) return <Document />;
  const { ctx } = buildRenderContext(project, images, page.language);
  return <Document creator="PDF Ebook Studio">{renderPage(ctx, page)}</Document>;
}
