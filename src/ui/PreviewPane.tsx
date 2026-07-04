import { useEffect, useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import { renderSinglePagePdf } from "../core/export/renderPdf";
import { renderPdfPageToCanvas } from "../core/export/pdfToImages";

/**
 * Live preview: renders the selected page through the real PDF engine and
 * paints it onto a canvas, so what you see is exactly what exports.
 */
export default function PreviewPane() {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "rendering" | "error">("idle");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const renderSeq = useRef(0);

  useEffect(() => {
    if (!project || !selectedPageId || !canvasRef.current) return;
    const seq = ++renderSeq.current;
    setStatus("rendering");
    const timer = setTimeout(async () => {
      try {
        const blob = await renderSinglePagePdf(project, images, selectedPageId);
        if (seq !== renderSeq.current || !canvasRef.current) return;
        await renderPdfPageToCanvas(blob, canvasRef.current, 1, 1.6);
        if (seq === renderSeq.current) {
          setStatus("idle");
          setError("");
        }
      } catch (e) {
        if (seq === renderSeq.current) {
          setStatus("error");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    }, 350); // debounce while typing
    return () => clearTimeout(timer);
  }, [project, images, selectedPageId]);

  if (!project) return null;
  if (!selectedPageId) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-stone-400">
        Select or add a page to see its preview.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end gap-1 px-3 py-1.5 shrink-0">
        <span className="text-[11px] text-stone-400 mr-auto pl-1">
          {status === "rendering" ? "Rendering preview…" : "Live PDF preview — exactly what exports"}
        </span>
        <button className="btn-ghost text-xs px-2 py-0.5" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>
          −
        </button>
        <span className="text-[11px] text-stone-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button className="btn-ghost text-xs px-2 py-0.5" onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}>
          +
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        {status === "error" ? (
          <div className="max-w-sm rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Preview failed</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded-sm bg-white"
            style={{
              width: `${446 * zoom}px`,
              opacity: status === "rendering" ? 0.6 : 1,
              transition: "opacity 150ms",
            }}
          />
        )}
      </div>
    </div>
  );
}
