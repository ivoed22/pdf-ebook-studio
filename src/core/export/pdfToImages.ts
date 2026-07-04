import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface RenderedPage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Rasterizes PDF pages to PNG/JPEG blobs.
 * scale 1 = 72 DPI; scale 2.8 ≈ 200 DPI for crisp Etsy previews.
 */
export async function pdfToImages(
  pdfBlob: Blob,
  options: { scale?: number; type?: "image/png" | "image/jpeg"; quality?: number; pageNumbers?: number[] } = {},
): Promise<RenderedPage[]> {
  const { scale = 2.8, type = "image/jpeg", quality = 0.92, pageNumbers } = options;
  const data = await pdfBlob.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const results: RenderedPage[] = [];
  const targets = pageNumbers ?? Array.from({ length: doc.numPages }, (_, i) => i + 1);

  for (const n of targets) {
    if (n < 1 || n > doc.numPages) continue;
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d")!;
    // intent "print": full quality, and rendering is scheduled with timeouts
    // instead of requestAnimationFrame (which stalls in background tabs).
    await page.render({ canvasContext: context, viewport, intent: "print" }).promise;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))), type, quality),
    );
    results.push({ pageNumber: n, blob, width: canvas.width, height: canvas.height });
    canvas.width = 0;
    canvas.height = 0;
  }
  await doc.destroy();
  return results;
}

/** Renders a single PDF page into a canvas element (for the live preview). */
export async function renderPdfPageToCanvas(
  pdfBlob: Blob,
  canvas: HTMLCanvasElement,
  pageNumber = 1,
  scale = 1.5,
): Promise<void> {
  const data = await pdfBlob.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const page = await doc.getPage(Math.min(pageNumber, doc.numPages));
    const viewport = page.getViewport({ scale });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d")!;
    await page.render({ canvasContext: context, viewport, intent: "print" }).promise;
  } finally {
    await doc.destroy();
  }
}
