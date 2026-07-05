import { useEffect, useState } from "react";
import { useStudio } from "../store/useStudio";
import { getTemplate, templatesForProductType } from "../core/templates/registry";
import { getPageThumbCached, pageThumbKey, requestPageThumb } from "../core/thumbs";
import { useT } from "../i18n/strings";
import { confirmDialog } from "./kit/ConfirmDialog";
import { Icon } from "./kit/Icon";
import type { Page } from "../types/project";

export default function PageList() {
  const project = useStudio((s) => s.project);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const selectPage = useStudio((s) => s.selectPage);
  const addPage = useStudio((s) => s.addPage);
  const renumberPages = useStudio((s) => s.renumberPages);
  const activeLanguage = useStudio((s) => s.activeLanguage);
  const t = useT();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  if (!project) return null;
  const pages = project.pages
    .filter((p) => p.language === activeLanguage)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  const needsRenumber =
    pages.some((p, i) => p.pageNumber !== i + 1) && pages.length > 0;

  function handleAdd() {
    const defaultTemplate =
      templatesForProductType(project!.projectMeta.productType).find((t) => !t.outputOnly)?.id ??
      "guide-text-page";
    const nextNumber = pages.length ? Math.max(...pages.map((p) => p.pageNumber)) + 1 : 1;
    addPage({
      pageNumber: nextNumber,
      template: defaultTemplate,
      language: activeLanguage,
      fields: {},
    });
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="panel-title">
          {t("pagesHeader")} · {activeLanguage.toUpperCase()}
        </span>
        <button className="btn-ghost text-xs px-2 py-1" onClick={handleAdd}>
          {t("addPage")}
        </button>
      </div>
      {needsRenumber && (
        <button
          className="w-full mb-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100 cursor-pointer"
          onClick={() => renumberPages(activeLanguage)}
        >
          {t("renumber")}
        </button>
      )}
      {pages.length === 0 && (
        <p className="text-xs text-stone-400 py-6 text-center">{t("noPagesInLang")}</p>
      )}
      <ul className="space-y-1" title={t("dragHint")}>
        {pages.map((page) => (
          <PageRow
            key={page.id}
            page={page}
            selected={page.id === selectedPageId}
            isDropTarget={dropTargetId === page.id && dragId !== page.id}
            onSelect={() => selectPage(page.id)}
            onDragStart={() => setDragId(page.id)}
            onDragOverRow={() => setDropTargetId(page.id)}
            onDrop={() => {
              if (dragId) useStudio.getState().reorderPage(dragId, page.id);
              setDragId(null);
              setDropTargetId(null);
            }}
            onDragEnd={() => {
              setDragId(null);
              setDropTargetId(null);
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function PageRow({
  page,
  selected,
  isDropTarget,
  onSelect,
  onDragStart,
  onDragOverRow,
  onDrop,
  onDragEnd,
}: {
  page: Page;
  selected: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOverRow: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const project = useStudio((s) => s.project)!;
  const images = useStudio((s) => s.images);
  const duplicatePage = useStudio((s) => s.duplicatePage);
  const removePage = useStudio((s) => s.removePage);
  const t = useT();
  const template = getTemplate(page.template);

  const thumbKey = pageThumbKey(project, page.id);
  const [thumb, setThumb] = useState<string | undefined>(() => getPageThumbCached(thumbKey));

  useEffect(() => {
    let alive = true;
    const cached = getPageThumbCached(thumbKey);
    if (cached) {
      setThumb(cached);
      return;
    }
    setThumb(undefined);
    const timer = setTimeout(() => {
      requestPageThumb(project, images, page.id, thumbKey, (dataUrl) => {
        if (alive) setThumb(dataUrl);
      });
    }, 600); // wait for typing bursts to settle
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [thumbKey, project, images, page.id]);

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverRow();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={`group rounded-md border px-2 py-2 cursor-pointer transition-colors ${
        selected ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-stone-400"
      } ${isDropTarget ? "border-t-2 border-t-amber-600" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <span className="text-stone-300 group-hover:text-stone-400 cursor-grab shrink-0">
          <Icon name="drag" size={12} />
        </span>
        <span className="w-9 h-12 rounded-sm border border-stone-200 bg-white overflow-hidden shrink-0">
          {thumb ? (
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-stone-200">
              <Icon name="page" size={12} />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-bold px-1 py-px rounded shrink-0 ${
                selected ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-500"
              }`}
            >
              {page.pageNumber}
            </span>
            <span className="text-xs font-medium text-stone-800 truncate">
              {typeof page.fields.title === "string" && page.fields.title
                ? page.fields.title
                : t("untitled")}
            </span>
          </div>
          <div className="text-[10px] text-stone-400 truncate mt-0.5">
            {template?.name ?? page.template ?? t("noTemplate")}
          </div>
        </div>
        <span className="hidden group-hover:flex flex-col gap-0.5 shrink-0">
          <button
            className="p-0.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            title={t("copy")}
            onClick={(e) => {
              e.stopPropagation();
              duplicatePage(page.id);
            }}
          >
            <Icon name="copy" size={11} />
          </button>
          <button
            className="p-0.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
            title={t("delete")}
            onClick={async (e) => {
              e.stopPropagation();
              const ok = await confirmDialog({
                title: t("removePageQ"),
                message: t("removePageBody", { n: page.pageNumber }),
                confirmLabel: t("delete"),
                danger: true,
              });
              if (ok) removePage(page.id);
            }}
          >
            <Icon name="trash" size={11} />
          </button>
        </span>
      </div>
    </li>
  );
}
