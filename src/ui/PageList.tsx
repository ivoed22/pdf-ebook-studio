import { useEffect, useState } from "react";
import { useStudio } from "../store/useStudio";
import { getTemplate, templatesForProductType } from "../core/templates/registry";
import { getPageThumbCached, pageThumbKey, requestPageThumb } from "../core/thumbs";
import { useT } from "../i18n/strings";
import { confirmDialog } from "./kit/ConfirmDialog";
import { Icon } from "./kit/Icon";
import type { Page } from "../types/project";
import { OverflowMenu } from "./kit/OverflowMenu";
import { toast } from "./kit/Toaster";

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
  const [arranging, setArranging] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!project) return null;
  const pages = project.pages
    .filter((p) => p.language === activeLanguage)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  const needsRenumber =
    pages.some((p, i) => p.pageNumber !== i + 1) && pages.length > 0;
  const groups = pages.reduce<{ name: string; pages: Page[] }[]>((result, page) => {
    const name = page.chapter?.trim() || "Zonder hoofdstuk";
    const current = result[result.length - 1];
    if (!current || current.name !== name) result.push({ name, pages: [page] });
    else current.pages.push(page);
    return result;
  }, []);

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="panel-title">
          {t("pagesHeader")} · {activeLanguage.toUpperCase()}
        </span>
        <span className="flex gap-1"><button className="btn-ghost px-3" aria-pressed={selecting} onClick={() => { setSelecting((value) => !value); setSelectedIds(new Set()); }}>Selecteer</button><button className="btn-ghost px-3" aria-pressed={arranging} onClick={() => setArranging((value) => !value)}>{arranging ? "Klaar" : "Ordenen"}</button><button className="btn-ghost px-3" onClick={handleAdd}>{t("addPage")}</button></span>
      </div>
      {selecting && <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2"><p className="mb-2 text-xs font-semibold">{selectedIds.size} pagina('s) geselecteerd</p><div className="grid grid-cols-3 gap-1"><button className="btn-ghost px-2 text-xs" disabled={!selectedIds.size} onClick={() => { for (const id of selectedIds) useStudio.getState().duplicatePage(id); setSelectedIds(new Set()); }}>Dupliceer</button><select className="input min-w-0 text-xs" value="" disabled={!selectedIds.size} onChange={(event) => { if (!event.target.value) return; for (const id of selectedIds) useStudio.getState().setPageTemplate(id, event.target.value); event.target.value = ""; }}><option value="">Template…</option>{templatesForProductType(project.projectMeta.productType).filter((template) => !template.outputOnly).map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select><button className="btn-ghost px-2 text-xs text-[var(--danger)]" disabled={!selectedIds.size} onClick={async () => { const ok = await confirmDialog({ title: "Pagina's verwijderen?", message: `${selectedIds.size} geselecteerde pagina('s) worden verwijderd.`, confirmLabel: t("delete"), danger: true }); if (ok) { for (const id of selectedIds) useStudio.getState().removePage(id); setSelectedIds(new Set()); } }}>Verwijder</button></div></div>}
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
      <div className="space-y-3" aria-label={`${t("pagesHeader")} ${activeLanguage.toUpperCase()}`}>{groups.map((group) => <details key={`${group.name}-${group.pages[0]?.id}`} open className="group/chapter"><summary className="mb-2 flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)] hover:bg-[var(--surface-soft)]"><span>{group.name}</span><span>{group.pages.length}</span></summary><ul className="space-y-2">{group.pages.map((page) => { const index = pages.findIndex((item) => item.id === page.id); return <PageRow key={page.id} page={page} selected={page.id === selectedPageId} bulkSelected={selectedIds.has(page.id)} selecting={selecting} onToggleBulk={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(page.id)) next.delete(page.id); else next.add(page.id); return next; })} isDropTarget={dropTargetId === page.id && dragId !== page.id} onSelect={() => selectPage(page.id)} onDragStart={() => setDragId(page.id)} onDragOverRow={() => setDropTargetId(page.id)} onDrop={() => { if (dragId) useStudio.getState().reorderPage(dragId, page.id); setDragId(null); setDropTargetId(null); }} onDragEnd={() => { setDragId(null); setDropTargetId(null); }} onMoveUp={index > 0 ? () => useStudio.getState().reorderPage(page.id, pages[index - 1].id) : undefined} onMoveDown={index < pages.length - 1 ? () => useStudio.getState().reorderPage(page.id, pages[index + 1].id) : undefined} arranging={arranging} />; })}</ul></details>)}</div>
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
  arranging,
  selecting,
  bulkSelected,
  onToggleBulk,
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
  arranging: boolean;
  selecting: boolean;
  bulkSelected: boolean;
  onToggleBulk: () => void;
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
        {selecting && <input className="h-5 w-5 shrink-0" type="checkbox" checked={bulkSelected} aria-label={`Pagina ${page.pageNumber} selecteren`} onChange={onToggleBulk} />}
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
        {arranging ? <span className="flex shrink-0 gap-1"><button className="icon-button" aria-label={`Pagina ${page.pageNumber} omhoog`} disabled={!onMoveUp} onClick={onMoveUp}><Icon name="up" size={16} /></button><button className="icon-button" aria-label={`Pagina ${page.pageNumber} omlaag`} disabled={!onMoveDown} onClick={onMoveDown}><Icon name="down" size={16} /></button></span> : <OverflowMenu label={`Acties voor pagina ${page.pageNumber}`} align="bottom"><button role="menuitem" className="btn-ghost w-full justify-start" onClick={() => duplicatePage(page.id)}><Icon name="copy" size={16} />{t("duplicate")}</button><button role="menuitem" className="btn-ghost w-full justify-start text-[var(--danger)]" onClick={async () => { const ok = await confirmDialog({ title: t("removePageQ"), message: t("removePageBody", { n: page.pageNumber }), confirmLabel: t("delete"), danger: true }); if (ok) { removePage(page.id); toast.undo(`Pagina ${page.pageNumber} verwijderd`, () => useStudio.getState().undo()); } }}><Icon name="trash" size={16} />{t("delete")}</button></OverflowMenu>}
      </div>
    </li>
  );
}
