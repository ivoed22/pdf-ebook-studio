import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { ImageAsset, Language, Project } from "../../types/project";
import { renderProjectPdf, slugify } from "./renderPdf";
import { pdfToImages, type RenderedPage } from "./pdfToImages";
import { renderContactSheet } from "./contactSheet";
import { issuesAsReport, missingAssetsReport, validateProject } from "../validation/engine";
import { listingDescription, listingTags, listingTitle, readMeText } from "./listingTexts";
import { renderEtsyVisuals } from "./etsyVisuals";

export type ExportProgress = (step: string) => void;

interface LanguageArtifacts {
  language: Language;
  pdf: Blob;
  previews: RenderedPage[];
  contactSheet: Blob;
}

async function buildArtifacts(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  onProgress: ExportProgress,
  previewScale = 2.8,
): Promise<LanguageArtifacts> {
  onProgress(`Rendering ${language.toUpperCase()} PDF…`);
  const pdfBlob = await renderProjectPdf(project, images, language);
  onProgress(`Rendering ${language.toUpperCase()} page previews…`);
  const previews = await pdfToImages(pdfBlob, { scale: previewScale });
  onProgress(`Building ${language.toUpperCase()} contact sheet…`);
  const sheet = await renderContactSheet(project, language, previews);
  return { language, pdf: pdfBlob, previews, contactSheet: sheet };
}

export async function exportFinalPdf(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  onProgress: ExportProgress = () => {},
): Promise<void> {
  onProgress(`Rendering ${language.toUpperCase()} PDF…`);
  const blob = await renderProjectPdf(project, images, language);
  saveAs(blob, `${slugify(project.projectMeta.title)}-${language}.pdf`);
}

export async function exportPagePreviews(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  onProgress: ExportProgress = () => {},
): Promise<void> {
  const slug = slugify(project.projectMeta.title);
  onProgress(`Rendering ${language.toUpperCase()} PDF…`);
  const pdfBlob = await renderProjectPdf(project, images, language);
  onProgress("Rasterizing pages…");
  const previews = await pdfToImages(pdfBlob, { scale: 2.8 });
  const zip = new JSZip();
  for (const p of previews) {
    zip.file(`${slug}-${language}-page-${String(p.pageNumber).padStart(2, "0")}.jpg`, p.blob);
  }
  onProgress("Zipping previews…");
  saveAs(await zip.generateAsync({ type: "blob" }), `${slug}-${language}-page-previews.zip`);
}

export async function exportContactSheet(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  onProgress: ExportProgress = () => {},
): Promise<void> {
  const artifacts = await buildArtifacts(project, images, language, onProgress, 1.6);
  saveAs(artifacts.contactSheet, `${slugify(project.projectMeta.title)}-${language}-contact-sheet.pdf`);
}

export async function exportCustomerZip(
  project: Project,
  images: Map<string, ImageAsset>,
  languages: Language[],
  onProgress: ExportProgress = () => {},
): Promise<void> {
  const slug = slugify(project.projectMeta.title);
  const zip = new JSZip();
  for (const language of languages) {
    onProgress(`Rendering ${language.toUpperCase()} PDF…`);
    const pdfBlob = await renderProjectPdf(project, images, language);
    zip.file(`${slug}-${language}.pdf`, pdfBlob);
    zip.file(language === "nl" ? "Lees-mij.txt" : "Read-Me.txt", readMeText(project, language));
  }
  onProgress("Zipping customer pack…");
  saveAs(await zip.generateAsync({ type: "blob" }), `${slug}-customer-pack.zip`);
}

export async function exportEtsyVisuals(
  project: Project,
  images: Map<string, ImageAsset>,
  languages: Language[],
  onProgress: ExportProgress = () => {},
): Promise<void> {
  const slug = slugify(project.projectMeta.title);
  const zip = new JSZip();
  for (const language of languages) {
    const visuals = await renderEtsyVisuals(project, images, language, onProgress);
    for (const v of visuals) zip.file(v.name, v.blob);
  }
  onProgress("Zipping listing images…");
  saveAs(await zip.generateAsync({ type: "blob" }), `${slug}-etsy-listing-images.zip`);
}

export async function exportSellerZip(
  project: Project,
  images: Map<string, ImageAsset>,
  languages: Language[],
  onProgress: ExportProgress = () => {},
): Promise<void> {
  const slug = slugify(project.projectMeta.title);
  const zip = new JSZip();

  for (const language of languages) {
    const art = await buildArtifacts(project, images, language, onProgress);
    const dir = zip.folder(language)!;
    dir.file(`${slug}-${language}.pdf`, art.pdf);
    dir.file(`${slug}-${language}-contact-sheet.pdf`, art.contactSheet);
    const previewDir = dir.folder("page-previews")!;
    for (const p of art.previews) {
      previewDir.file(`page-${String(p.pageNumber).padStart(2, "0")}.jpg`, p.blob);
    }
    const listing = dir.folder("etsy-listing")!;
    listing.file("listing-title.txt", listingTitle(project, language));
    listing.file("listing-description.txt", listingDescription(project, language));
    listing.file("listing-tags.txt", listingTags(project, language));
    listing.file(language === "nl" ? "Lees-mij.txt" : "Read-Me.txt", readMeText(project, language));
    const photos = listing.folder("listing-photos")!;
    const visuals = await renderEtsyVisuals(project, images, language, onProgress, art.previews);
    for (const v of visuals) photos.file(v.name, v.blob);
  }

  onProgress("Writing QC reports…");
  const issues = validateProject(project, images);
  zip.file("qc-report.txt", issuesAsReport(project, issues));
  zip.file("missing-assets-report.txt", missingAssetsReport(project, images));

  onProgress("Zipping seller pack…");
  saveAs(await zip.generateAsync({ type: "blob" }), `${slug}-seller-etsy-pack.zip`);
}
