import { useEffect, useMemo, useState } from "react";
import { useStudio } from "../store/useStudio";
import { validateProject, errorCount } from "../core/validation/engine";
import { useT } from "../i18n/strings";
import PageList from "./PageList";
import PageEditor from "./PageEditor";
import PreviewPane from "./PreviewPane";
import AssetManager from "./AssetManager";
import PaletteManager from "./PaletteManager";
import QCPanel from "./QCPanel";
import ExportPanel from "./ExportPanel";
import ProjectSettings from "./ProjectSettings";
import ShortcutsOverlay from "./ShortcutsOverlay";
import { Icon } from "./kit/Icon";
import { LangToggle } from "./kit/LangToggle";

type Tab = "page" | "assets" | "palettes" | "qc" | "export" | "settings";

function isTypingTarget(el: EventTarget | null): boolean {
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
  );
}

export default function EditorScreen() {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const closeProject = useStudio((s) => s.closeProject);
  const activeLanguage = useStudio((s) => s.activeLanguage);
  const setActiveLanguage = useStudio((s) => s.setActiveLanguage);
  const saveState = useStudio((s) => s.saveState);
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const t = useT();
  const [tab, setTab] = useState<Tab>("page");
  const [helpOpen, setHelpOpen] = useState(false);

  const issues = useMemo(
    () => (project ? validateProject(project, images) : []),
    [project, images],
  );
  const errors = errorCount(issues);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = useStudio.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (s.selectedPageId) s.duplicatePage(s.selectedPageId);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === "PageUp" || e.key === "PageDown") {
        e.preventDefault();
        const pages = (s.project?.pages ?? [])
          .filter((p) => p.language === s.activeLanguage)
          .sort((a, b) => a.pageNumber - b.pageNumber);
        const idx = pages.findIndex((p) => p.id === s.selectedPageId);
        const next = pages[idx + (e.key === "PageDown" ? 1 : -1)];
        if (next) s.selectPage(next.id);
        return;
      }
      if (e.key === "?") setHelpOpen((h) => !h);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!project) return null;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "page", label: t("tabPage") },
    { id: "assets", label: t("tabImages"), badge: images.size || undefined },
    { id: "palettes", label: t("tabPalettes") },
    { id: "qc", label: t("tabQc"), badge: issues.length || undefined },
    { id: "export", label: t("tabExport") },
    { id: "settings", label: t("tabProject") },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="lg:hidden p-3 text-center text-xs text-amber-800 bg-amber-50 border-b border-amber-200">
        {t("narrowScreen")}
      </div>
      <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-2 shrink-0">
        <button className="btn-ghost text-sm" onClick={closeProject}>
          {t("backToProjects")}
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-stone-900 truncate leading-tight">
            {project.projectMeta.title}
          </h1>
          <span className={`text-[10px] ${saveState === "saved" ? "text-emerald-600" : "text-stone-400"}`}>
            {saveState === "saved" ? t("saved") : t("saving")}
          </span>
        </div>
        <div className="flex items-center gap-0.5 ml-2">
          <button
            className="btn-ghost px-1.5 py-1"
            title={`${t("undo")} (Ctrl+Z)`}
            disabled={!canUndo}
            onClick={undo}
          >
            <Icon name="undo" size={14} />
          </button>
          <button
            className="btn-ghost px-1.5 py-1"
            title={`${t("redo")} (Ctrl+Y)`}
            disabled={!canRedo}
            onClick={redo}
          >
            <Icon name="redo" size={14} />
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {project.languageVersions.length > 1 && (
            <div className="flex rounded-md border border-stone-300 overflow-hidden">
              {project.languageVersions.map((lang) => (
                <button
                  key={lang}
                  className={`px-3 py-1 text-xs font-semibold cursor-pointer ${
                    activeLanguage === lang ? "bg-stone-900 text-white" : "bg-white text-stone-500"
                  }`}
                  onClick={() => setActiveLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <button
            className={`btn text-xs ${errors ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
            onClick={() => setTab("qc")}
          >
            {errors ? t("errorsN", { n: errors }) : t("qcClean")}
          </button>
          <LangToggle />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-60 shrink-0 border-r border-stone-200 bg-white overflow-y-auto">
          <PageList />
        </aside>

        <main className="flex-1 min-w-0 bg-stone-200/60 overflow-hidden">
          <PreviewPane />
        </main>

        <aside className="w-[26rem] shrink-0 border-l border-stone-200 bg-white flex flex-col">
          <nav className="flex border-b border-stone-200 shrink-0">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                className={`flex-1 px-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide cursor-pointer border-b-2 ${
                  tab === tb.id
                    ? "border-amber-700 text-stone-900"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
                onClick={() => setTab(tb.id)}
              >
                {tb.label}
                {tb.badge ? <span className="ml-1 text-amber-700">{tb.badge}</span> : null}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto">
            {tab === "page" && <PageEditor />}
            {tab === "assets" && <AssetManager />}
            {tab === "palettes" && <PaletteManager />}
            {tab === "qc" && <QCPanel issues={issues} />}
            {tab === "export" && <ExportPanel errors={errors} />}
            {tab === "settings" && <ProjectSettings />}
          </div>
        </aside>
      </div>
      {helpOpen && <ShortcutsOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
