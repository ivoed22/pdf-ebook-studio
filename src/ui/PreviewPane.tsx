import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import { renderProjectPdf, renderSinglePagePdf } from "../core/export/renderPdf";
import { pdfToImages, renderPdfPageToCanvas } from "../core/export/pdfToImages";
import { useT } from "../i18n/strings";
import { Icon } from "./kit/Icon";

/** Small LRU cache of rendered pages so switching back is instant. */
const renderCache = new Map<string, string>();
const CACHE_LIMIT = 24;

function cacheGet(key: string): string | undefined {
  return renderCache.get(key);
}
function cachePut(key: string, dataUrl: string) {
  if (renderCache.size >= CACHE_LIMIT) {
    const first = renderCache.keys().next().value;
    if (first) renderCache.delete(first);
  }
  renderCache.set(key, dataUrl);
}

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Live preview: renders the selected page through the real PDF engine and
 * paints it onto a canvas, so what you see is exactly what exports.
 */
export default function PreviewPane() {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const selectPage = useStudio((s) => s.selectPage);
  const activeLanguage = useStudio((s) => s.activeLanguage);
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "rendering" | "error">("idle");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [gridMode, setGridMode] = useState(false);
  const renderSeq = useRef(0);

  const langPages = useMemo(
    () =>
      project
        ? project.pages
            .filter((p) => p.language === activeLanguage)
            .sort((a, b) => a.pageNumber - b.pageNumber)
        : [],
    [project, activeLanguage],
  );
  const currentIndex = langPages.findIndex((p) => p.id === selectedPageId);

  const cacheKey = useMemo(() => {
    if (!project || !selectedPageId) return "";
    const page = project.pages.find((p) => p.id === selectedPageId);
    if (!page) return "";
    return `${selectedPageId}:${project.projectMeta.theme}:${hash(JSON.stringify(page))}:${images.size}`;
  }, [project, selectedPageId, images]);

  useEffect(() => {
    if (!project || !selectedPageId || !canvasRef.current || gridMode) return;
    const seq = ++renderSeq.current;

    const cached = cacheKey && cacheGet(cacheKey);
    if (cached) {
      void paintDataUrl(canvasRef.current, cached).then(() => {
        if (seq === renderSeq.current) setStatus("idle");
      });
      return;
    }

    setStatus("rendering");
    const timer = setTimeout(async () => {
      try {
        const blob = await renderSinglePagePdf(project, images, selectedPageId);
        if (seq !== renderSeq.current || !canvasRef.current) return;
        await renderPdfPageToCanvas(blob, canvasRef.current, 1, 1.6);
        if (cacheKey) cachePut(cacheKey, canvasRef.current.toDataURL("image/jpeg", 0.85));
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
  }, [project, images, selectedPageId, cacheKey, gridMode]);

  if (!project) return null;
  if (!selectedPageId && !gridMode) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-stone-400">
        {t("selectOrAdd")}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-3 py-1.5 shrink-0">
        <span className="text-[11px] text-stone-400 pl-1">
          {status === "rendering" && !gridMode ? t("rendering") : t("livePreview")}
        </span>
        <div className="mx-auto flex items-center gap-1">
          <button
            className="btn-ghost text-xs px-1.5 py-0.5"
            disabled={currentIndex <= 0}
            onClick={() => selectPage(langPages[currentIndex - 1].id)}
          >
            <Icon name="left" size={13} />
          </button>
          <span className="text-[11px] text-stone-500 min-w-24 text-center">
            {currentIndex >= 0
              ? t("pageOf", { a: currentIndex + 1, b: langPages.length })
              : `${langPages.length}`}
          </span>
          <button
            className="btn-ghost text-xs px-1.5 py-0.5"
            disabled={currentIndex < 0 || currentIndex >= langPages.length - 1}
            onClick={() => selectPage(langPages[currentIndex + 1].id)}
          >
            <Icon name="right" size={13} />
          </button>
        </div>
        <button
          className={`btn text-xs px-2 py-0.5 gap-1 ${gridMode ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200"}`}
          onClick={() => setGridMode((g) => !g)}
          title={gridMode ? t("onePage") : t("allPages")}
        >
          <Icon name={gridMode ? "page" : "grid"} size={12} />
          {gridMode ? t("onePage") : t("allPages")}
        </button>
        {!gridMode && (
          <>
            <button className="btn-ghost text-xs px-2 py-0.5" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>
              −
            </button>
            <span className="text-[11px] text-stone-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button className="btn-ghost text-xs px-2 py-0.5" onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}>
              +
            </button>
          </>
        )}
      </div>
      {gridMode ? (
        <PreviewGrid onPick={(pageId) => {
          selectPage(pageId);
          setGridMode(false);
        }} />
      ) : (
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
          {status === "error" ? (
            <div className="max-w-sm rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold mb-1">{t("previewFailed")}</p>
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
      )}
    </div>
  );
}

async function paintDataUrl(canvas: HTMLCanvasElement, dataUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

function PreviewGrid({ onPick }: { onPick: (pageId: string) => void }) {
  const project = useStudio((s) => s.project)!;
  const images = useStudio((s) => s.images);
  const activeLanguage = useStudio((s) => s.activeLanguage);
  const t = useT();
  const [items, setItems] = useState<{ pageId: string; pageNumber: number; url: string }[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    (async () => {
      try {
        const pages = project.pages
          .filter((p) => p.language === activeLanguage)
          .sort((a, b) => a.pageNumber - b.pageNumber);
        const blob = await renderProjectPdf(project, images, activeLanguage);
        const rendered = await pdfToImages(blob, { scale: 0.7 });
        if (!alive) return;
        const list = rendered.map((r, i) => {
          const url = URL.createObjectURL(r.blob);
          urls.push(url);
          return { pageId: pages[i]?.id ?? "", pageNumber: pages[i]?.pageNumber ?? r.pageNumber, url };
        });
        setItems(list);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [project, images, activeLanguage]);

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }
  if (!items) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-stone-400">
        <span className="animate-pulse">{t("gridLoading")}</span>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {items.map((item) => (
          <button
            key={item.pageId || item.pageNumber}
            className="group text-left cursor-pointer"
            onClick={() => item.pageId && onPick(item.pageId)}
          >
            <img
              src={item.url}
              alt={`Page ${item.pageNumber}`}
              className="w-full rounded-sm shadow group-hover:shadow-lg group-hover:ring-2 ring-amber-600/50 transition-all bg-white"
            />
            <div className="text-center text-[11px] text-stone-500 mt-1.5">{item.pageNumber}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
