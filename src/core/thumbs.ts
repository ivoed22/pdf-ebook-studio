import type { ImageAsset, Project } from "../types/project";
import * as db from "./storage/db";
import { renderSinglePagePdf } from "./export/renderPdf";
import { renderPdfPageToCanvas } from "./export/pdfToImages";

/**
 * Cover thumbnails for the dashboard: first page of the first language
 * version, rendered small and cached in IndexedDB keyed on updatedAt.
 * Renders run sequentially so opening the dashboard stays responsive.
 */

const queue: (() => Promise<void>)[] = [];
let running = false;

function enqueue(job: () => Promise<void>) {
  queue.push(job);
  if (!running) void drain();
}

async function drain() {
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try {
      await job();
    } catch {
      // thumbnail failures are cosmetic — never break the dashboard
    }
  }
  running = false;
}

export function getCoverThumb(project: Project, onReady: (dataUrl: string) => void): void {
  void db.loadThumb(project.id).then((existing) => {
    if (existing && existing.updatedAt === project.updatedAt) {
      onReady(existing.dataUrl);
      return;
    }
    enqueue(async () => {
      const firstPage = project.pages
        .filter((p) => p.language === (project.languageVersions[0] ?? "en"))
        .sort((a, b) => a.pageNumber - b.pageNumber)[0];
      if (!firstPage) return;
      const assets = await db.loadImages(project.id);
      const images = new Map<string, ImageAsset>(assets.map((a) => [a.filename, a]));
      const blob = await renderSinglePagePdf(project, images, firstPage.id);
      const canvas = document.createElement("canvas");
      await renderPdfPageToCanvas(blob, canvas, 1, 0.45);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      canvas.width = 0;
      await db.saveThumb(project.id, project.updatedAt, dataUrl);
      onReady(dataUrl);
    });
  });
}

/**
 * In-memory single-page thumbnails for the page list.
 * Key: pageId + content signature; capped LRU-ish cache.
 */
const pageThumbCache = new Map<string, string>();
const PAGE_THUMB_LIMIT = 120;

export function pageThumbKey(project: Project, pageId: string): string {
  const page = project.pages.find((p) => p.id === pageId);
  if (!page) return pageId;
  return `${pageId}:${project.projectMeta.theme}:${simpleHash(JSON.stringify(page))}`;
}

export function getPageThumbCached(key: string): string | undefined {
  return pageThumbCache.get(key);
}

export function requestPageThumb(
  project: Project,
  images: Map<string, ImageAsset>,
  pageId: string,
  key: string,
  onReady: (dataUrl: string) => void,
): void {
  const cached = pageThumbCache.get(key);
  if (cached) {
    onReady(cached);
    return;
  }
  const snapshot = structuredClone(project);
  enqueue(async () => {
    if (pageThumbCache.has(key)) {
      onReady(pageThumbCache.get(key)!);
      return;
    }
    const blob = await renderSinglePagePdf(snapshot, images, pageId);
    const canvas = document.createElement("canvas");
    await renderPdfPageToCanvas(blob, canvas, 1, 0.22);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    canvas.width = 0;
    if (pageThumbCache.size >= PAGE_THUMB_LIMIT) {
      const firstKey = pageThumbCache.keys().next().value;
      if (firstKey) pageThumbCache.delete(firstKey);
    }
    pageThumbCache.set(key, dataUrl);
    onReady(dataUrl);
  });
}

function simpleHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
