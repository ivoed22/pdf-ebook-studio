import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStudio } from "../store/useStudio";
import { useLayout, type WorkSection } from "../store/useLayout";
import { validateProject, errorCount } from "../core/validation/engine";
import { useT } from "../i18n/strings";
import PageList from "./PageList";
import ShortcutsOverlay from "./ShortcutsOverlay";
import { BottomNav } from "./kit/BottomNav";
import { Icon } from "./kit/Icon";
import { LangToggle } from "./kit/LangToggle";
import { PanelResizeHandle } from "./kit/PanelResizeHandle";
import { ProductionProgress } from "./ProductionProgress";

const PageEditor = lazy(() => import("./PageEditor"));
const PreviewPane = lazy(() => import("./PreviewPane"));
const ProductionPanel = lazy(() => import("./ProductionPanel"));
const PaletteManager = lazy(() => import("./PaletteManager"));
const QCPanel = lazy(() => import("./QCPanel"));
const ExportPanel = lazy(() => import("./ExportPanel"));
const ProjectSettings = lazy(() => import("./ProjectSettings"));

function isTypingTarget(element: EventTarget | null): boolean {
  return element instanceof HTMLElement && (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT" || element.isContentEditable);
}

function PanelFallback() {
  return <div className="flex h-full min-h-40 items-center justify-center text-sm text-[var(--muted)]" role="status"><span className="animate-pulse">Werkruimte laden…</span></div>;
}

const SECTIONS: { id: WorkSection; label: string; icon: string }[] = [
  { id: "content", label: "Inhoud", icon: "edit" },
  { id: "media", label: "Beelden", icon: "image" },
  { id: "style", label: "Stijl", icon: "palette" },
  { id: "qc", label: "Controle", icon: "shield" },
  { id: "export", label: "Export", icon: "export" },
  { id: "project", label: "Project", icon: "settings" },
];

export default function EditorScreen() {
  const project = useStudio((state) => state.project);
  const images = useStudio((state) => state.images);
  const closeProject = useStudio((state) => state.closeProject);
  const activeLanguage = useStudio((state) => state.activeLanguage);
  const setActiveLanguage = useStudio((state) => state.setActiveLanguage);
  const saveState = useStudio((state) => state.saveState);
  const canUndo = useStudio((state) => state.past.length > 0);
  const canRedo = useStudio((state) => state.future.length > 0);
  const undo = useStudio((state) => state.undo);
  const redo = useStudio((state) => state.redo);
  const t = useT();
  const layout = useLayout();
  const [helpOpen, setHelpOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  const issues = useMemo(() => project ? validateProject(project, images) : [], [project, images]);
  const errors = errorCount(issues);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const studio = useStudio.getState();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? studio.redo() : studio.undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        studio.redo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (studio.selectedPageId) studio.duplicatePage(studio.selectedPageId);
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        const pages = (studio.project?.pages ?? []).filter((page) => page.language === studio.activeLanguage).sort((a, b) => a.pageNumber - b.pageNumber);
        const index = pages.findIndex((page) => page.id === studio.selectedPageId);
        const next = pages[index + (event.key === "PageDown" ? 1 : -1)];
        if (next) studio.selectPage(next.id);
        return;
      }
      if (event.key === "?") setHelpOpen((open) => !open);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!project) return null;

  function selectSection(section: WorkSection) {
    layout.setWorkSection(section);
    layout.setMobileMode(section === "content" ? "edit" : "more");
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--canvas)]">
      <header className="studio-panel z-20 flex min-h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
        <button className="icon-button" aria-label={t("backToProjects")} onClick={closeProject}><Icon name="left" size={20} /></button>
        <div className="min-w-0 flex-1 sm:flex-none sm:max-w-xs">
          <h1 className="truncate font-display text-base font-semibold text-[var(--ink)] sm:text-lg">{project.projectMeta.title}</h1>
          <span className={`flex items-center gap-1 text-xs font-semibold ${saveState === "saved" ? "text-[var(--success)]" : saveState === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}`} role="status" aria-live="polite"><span className={`h-1.5 w-1.5 rounded-full ${saveState === "saved" ? "bg-[var(--success)]" : saveState === "error" ? "bg-[var(--danger)]" : "animate-pulse bg-[var(--accent)]"}`} />{saveState === "saved" ? t("saved") : saveState === "error" ? "Opslaan mislukt — maak een backup" : t("saving")}</span>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <button className="icon-button" aria-label={`${t("undo")} (Ctrl+Z)`} disabled={!canUndo} onClick={undo}><Icon name="undo" size={17} /></button>
          <button className="icon-button" aria-label={`${t("redo")} (Ctrl+Y)`} disabled={!canRedo} onClick={redo}><Icon name="redo" size={17} /></button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {project.languageVersions.length > 1 && <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] sm:flex" role="group" aria-label="Documenttaal">{project.languageVersions.map((language) => <button key={language} className={`min-h-11 min-w-11 px-3 text-xs font-bold ${activeLanguage === language ? "bg-[var(--surface-strong)] text-white" : "bg-white text-[var(--muted)]"}`} aria-pressed={activeLanguage === language} onClick={() => setActiveLanguage(language)}>{language.toUpperCase()}</button>)}</div>}
          <div className="hidden sm:block"><button className={`btn ${errors ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`} onClick={() => selectSection("qc")}><Icon name="shield" size={16} />{errors ? t("errorsN", { n: errors }) : t("qcClean")}</button></div>
          <div className="hidden md:block"><LangToggle /></div>
          <div className="hidden lg:block"><button className="icon-button" aria-label="Sneltoetsen" onClick={() => setHelpOpen(true)}>?</button></div>
        </div>
      </header>

      <div className="studio-panel shrink-0 border-b px-2 py-2 sm:px-4"><ProductionProgress project={project} errors={errors} compact={!desktop} onSelect={(id) => {
        if (id === "content") selectSection("content");
        else if (id === "images") selectSection("media");
        else if (id === "qc") selectSection("qc");
        else selectSection("export");
      }} /></div>

      <div id="main-content" className="min-h-0 flex-1">
        {desktop ? <div className="flex h-full min-h-0">
          {layout.pagePanelOpen && <aside className="studio-panel relative min-w-56 max-w-96 shrink-0 overflow-auto border-r" style={{ width: layout.pagePanelWidth }} aria-label="Pagina's"><PageList /><PanelResizeHandle side="left" value={layout.pagePanelWidth} min={224} max={384} onChange={layout.setPagePanelWidth} /></aside>}
          <main className="relative min-w-0 flex-1 overflow-hidden bg-[var(--preview-canvas)]">
            <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-2xl border border-white/70 bg-white/90 p-1 shadow-sm backdrop-blur">
              <button className="icon-button" aria-label={layout.pagePanelOpen ? "Paginapaneel sluiten" : "Paginapaneel openen"} aria-pressed={layout.pagePanelOpen} onClick={() => layout.setPagePanelOpen(!layout.pagePanelOpen)}><Icon name="pages" size={18} /></button>
              <button className="icon-button" aria-label={layout.inspectorOpen ? "Eigenschappenpaneel sluiten" : "Eigenschappenpaneel openen"} aria-pressed={layout.inspectorOpen} onClick={() => layout.setInspectorOpen(!layout.inspectorOpen)}><Icon name="settings" size={18} /></button>
            </div>
            <Suspense fallback={<PanelFallback />}><PreviewPane /></Suspense>
          </main>
          {layout.inspectorOpen && <aside className="studio-panel relative flex min-w-96 max-w-[36rem] shrink-0 flex-col border-l" style={{ width: layout.inspectorWidth }} aria-label="Eigenschappen"><PanelResizeHandle side="right" value={layout.inspectorWidth} min={384} max={576} onChange={layout.setInspectorWidth} /><WorkTabs active={layout.workSection} issues={issues.length} images={images.size} onChange={layout.setWorkSection} /><div className="min-h-0 flex-1 overflow-y-auto"><Suspense fallback={<PanelFallback />}><WorkContent section={layout.workSection} issues={issues} errors={errors} /></Suspense></div></aside>}
        </div> : <div className="flex h-full min-h-0 flex-col">
          <main className="min-h-0 flex-1 overflow-hidden">
            <MobileModePanel mode="pages" active={layout.mobileMode === "pages"}><PageList /></MobileModePanel>
            <div className={layout.mobileMode === "preview" ? "h-full" : "hidden"}><Suspense fallback={<PanelFallback />}><PreviewPane /></Suspense></div>
            <MobileModePanel mode="edit" active={layout.mobileMode === "edit"}><Suspense fallback={<PanelFallback />}><PageEditor /></Suspense></MobileModePanel>
            <div className={layout.mobileMode === "more" ? "flex h-full min-h-0 flex-col bg-white" : "hidden"}><WorkTabs active={layout.workSection} issues={issues.length} images={images.size} onChange={layout.setWorkSection} compact /><MobileModePanel mode="more" active><Suspense fallback={<PanelFallback />}><WorkContent section={layout.workSection} issues={issues} errors={errors} /></Suspense></MobileModePanel></div>
          </main>
          <BottomNav value={layout.mobileMode} onChange={(mode) => {
            if (mode === "more" && layout.workSection === "content") layout.setWorkSection("media");
            layout.setMobileMode(mode);
          }} />
        </div>}
      </div>
      {helpOpen && <ShortcutsOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function MobileModePanel({ mode, active, children }: { mode: "pages" | "edit" | "more"; active: boolean; children: ReactNode }) {
  const top = useLayout((s) => s.mobileScroll[mode]);
  const setTop = useLayout((s) => s.setMobileScroll);
  return <div className={active ? "h-full overflow-y-auto bg-white" : "hidden"} ref={(node) => { if (node && active && Math.abs(node.scrollTop - top) > 2) node.scrollTop = top; }} onScroll={(event) => setTop(mode, event.currentTarget.scrollTop)}>{children}</div>;
}

function WorkTabs({ active, issues, images, onChange, compact = false }: { active: WorkSection; issues: number; images: number; onChange: (section: WorkSection) => void; compact?: boolean }) {
  const visibleSections = compact ? SECTIONS.filter((section) => section.id !== "content") : SECTIONS;
  return <nav className={`shrink-0 border-b border-[var(--border)] bg-white ${compact ? "overflow-x-auto" : ""}`} aria-label="Werkgebieden"><div className={`flex ${compact ? "min-w-max px-2" : "grid grid-cols-3 gap-1 p-2"}`}>{visibleSections.map((section) => { const badge = section.id === "media" ? images : section.id === "qc" ? issues : 0; const selected = active === section.id; return <button key={section.id} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${selected ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "text-[var(--muted)] hover:bg-[var(--canvas)]"}`} aria-current={selected ? "page" : undefined} onClick={() => onChange(section.id)}><Icon name={section.icon} size={17} />{section.label}{badge > 0 && <span className="inline-flex min-w-5 justify-center rounded-full bg-white px-1.5 text-xs text-[var(--primary-strong)]">{badge}</span>}</button>; })}</div></nav>;
}

function WorkContent({ section, issues, errors }: { section: WorkSection; issues: ReturnType<typeof validateProject>; errors: number }): ReactNode {
  if (section === "content") return <PageEditor />;
  if (section === "media") return <ProductionPanel />;
  if (section === "style") return <PaletteManager />;
  if (section === "qc") return <QCPanel issues={issues} />;
  if (section === "export") return <ExportPanel errors={errors} />;
  return <ProjectSettings />;
}
