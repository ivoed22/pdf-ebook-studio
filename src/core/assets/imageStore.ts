import JSZip from "jszip";
import type { ImageAsset } from "../../types/project";

export const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function isSupportedImageFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Strips any folder prefix and normalizes the filename for matching. */
export function normalizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  return base.trim();
}

export interface UploadOutcome {
  added: ImageAsset[];
  skipped: string[]; // unsupported file types
  duplicates: string[]; // same filename uploaded again (replaced)
}

export async function assetsFromFiles(
  files: Iterable<File>,
  existing: Map<string, ImageAsset>,
): Promise<UploadOutcome> {
  const outcome: UploadOutcome = { added: [], skipped: [], duplicates: [] };
  for (const file of files) {
    const filename = normalizeFilename(file.name);
    if (filename.toLowerCase().endsWith(".zip")) {
      const inner = await assetsFromZip(file, existing);
      outcome.added.push(...inner.added);
      outcome.skipped.push(...inner.skipped);
      outcome.duplicates.push(...inner.duplicates);
      continue;
    }
    if (!isSupportedImageFilename(filename)) {
      outcome.skipped.push(filename);
      continue;
    }
    if (existing.has(filename)) outcome.duplicates.push(filename);
    outcome.added.push({ filename, type: file.type || guessMime(filename), size: file.size, blob: file });
  }
  return outcome;
}

export async function assetsFromZip(
  zipFile: Blob,
  existing: Map<string, ImageAsset>,
): Promise<UploadOutcome> {
  const outcome: UploadOutcome = { added: [], skipped: [], duplicates: [] };
  const zip = await JSZip.loadAsync(zipFile);
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const filename = normalizeFilename(entry.name);
    if (filename.startsWith("._") || filename.startsWith(".")) continue; // macOS metadata etc.
    if (!isSupportedImageFilename(filename)) {
      outcome.skipped.push(filename);
      continue;
    }
    const blob = await entry.async("blob");
    if (existing.has(filename)) outcome.duplicates.push(filename);
    outcome.added.push({
      filename,
      type: guessMime(filename),
      size: blob.size,
      blob: new Blob([blob], { type: guessMime(filename) }),
    });
  }
  return outcome;
}

export function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * Object URL cache so previews and the PDF engine can reference images by filename.
 * URLs are revoked when the image is replaced or removed.
 */
const urlCache = new Map<string, string>();

export function imageUrl(asset: ImageAsset): string {
  const existing = urlCache.get(asset.filename);
  if (existing) return existing;
  const url = URL.createObjectURL(asset.blob);
  urlCache.set(asset.filename, url);
  return url;
}

export function revokeImageUrl(filename: string): void {
  const url = urlCache.get(filename);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(filename);
  }
}

export function clearImageUrls(): void {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

/** Suggest an uploaded filename for a missing reference using the page-XX- prefix. */
export function suggestMatch(reference: string, available: string[]): string | undefined {
  const prefix = /^page-\d{2,}/.exec(reference.toLowerCase())?.[0];
  if (!prefix) return undefined;
  return available.find((f) => f.toLowerCase().startsWith(prefix));
}
