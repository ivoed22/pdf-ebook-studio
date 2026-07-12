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
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="panel-title">
          {t("pagesHeader")} · {activeLanguage.toUpperCase()}
        </span>
        <button className="btn-ghost px-3" onClick={handleAdd}>
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
      <ul className="space-y-2" aria-label={`${t("pagesHeader")} ${activeLanguage.toUpperCase()}`}>
        {pages.map((page, index) => (
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
            onMoveUp={index > 0 ? () => useStudio.getState().reorderPage(page.id, pages[index - 1].id) : undefined}
            onMoveDown={index < pages.length - 1 ? () => useStudio.getState().reorderPage(page.id, pages[index + 1].id) : undefined}
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
  onMoveUp,
  onMoveDown,
}: {
  page: Page;
  selected: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOverRow: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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
      className={`group rounded-xl border p-2 transition-colors ${
        selected ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
      } ${isDropTarget ? "border-t-2 border-t-[var(--primary)]" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-lg text-left" aria-pressed={selected} aria-label={`Pagina ${page.pageNumber}: ${typeof page.fields.title === "string" && page.fields.title ? page.fields.title : t("untitled")}`} onClick={onSelect}>
          <span className="hidden text-[var(--muted)] cursor-grab shrink-0 sm:block" aria-hidden><Icon name="drag" size={12} /></span>
          <span className="w-9 h-12 rounded-sm border border-stone-200 bg-white overflow-hidden shrink-0">{thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-stone-200"><Icon name="page" size={12} /></span>}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${selected ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`}>
                {page.pageNumber}
              </span>
              <span className="truncate text-sm font-semibold text-[var(--ink)]">{typeof page.fields.title === "string" && page.fields.title ? page.fields.title : t("untitled")}</span>
            </span>
            <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{template?.name ?? page.template ?? t("noTemplate")}</span>
          </span>
        </button>
        <span className="flex shrink-0 items-center gap-0.5">
          <button className="icon-button h-9 w-9" aria-label={`Pagina ${page.pageNumber} omhoog`} disabled={!onMoveUp} onClick={onMoveUp}><Icon name="up" size={14} /></button>
          <button className="icon-button h-9 w-9" aria-label={`Pagina ${page.pageNumber} omlaag`} disabled={!onMoveDown} onClick={onMoveDown}><Icon name="down" size={14} /></button>
          <button
            className="icon-button h-9 w-9"
            aria-label={`${t("copy")} pagina ${page.pageNumber}`}
            onClick={() => {
              duplicatePage(page.id);
            }}
          >
            <Icon name="copy" size={11} />
          </button>
          <button
            className="icon-button h-9 w-9 text-red-700"
            aria-label={`${t("delete")} pagina ${page.pageNumber}`}
            onClick={async () => {
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
