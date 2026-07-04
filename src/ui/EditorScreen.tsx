import { useMemo, useState } from "react";
import { useStudio } from "../store/useStudio";
import { validateProject, errorCount } from "../core/validation/engine";
import PageList from "./PageList";
import PageEditor from "./PageEditor";
import PreviewPane from "./PreviewPane";
import AssetManager from "./AssetManager";
import PaletteManager from "./PaletteManager";
import QCPanel from "./QCPanel";
import ExportPanel from "./ExportPanel";
import ProjectSettings from "./ProjectSettings";

type Tab = "page" | "assets" | "palettes" | "qc" | "export" | "settings";

export default function EditorScreen() {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const closeProject = useStudio((s) => s.closeProject);
  const activeLanguage = useStudio((s) => s.activeLanguage);
  const setActiveLanguage = useStudio((s) => s.setActiveLanguage);
  const [tab, setTab] = useState<Tab>("page");

  const issues = useMemo(
    () => (project ? validateProject(project, images) : []),
    [project, images],
  );
  const errors = errorCount(issues);

  if (!project) return null;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "page", label: "Page" },
    { id: "assets", label: "Images", badge: images.size || undefined },
    { id: "palettes", label: "Palettes" },
    { id: "qc", label: "QC", badge: issues.length || undefined },
    { id: "export", label: "Export" },
    { id: "settings", label: "Project" },
  ];

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-4 border-b border-stone-200 bg-white px-4 py-2.5 shrink-0">
        <button className="btn-ghost text-sm" onClick={closeProject}>
          ← Projects
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-stone-900 truncate">
            {project.projectMeta.title}
          </h1>
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
            {errors ? `${errors} error${errors > 1 ? "s" : ""}` : "QC clean"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r border-stone-200 bg-white overflow-y-auto">
          <PageList />
        </aside>

        <main className="flex-1 min-w-0 bg-stone-200/60 overflow-hidden">
          <PreviewPane />
        </main>

        <aside className="w-[26rem] shrink-0 border-l border-stone-200 bg-white flex flex-col">
          <nav className="flex border-b border-stone-200 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`flex-1 px-1 py-2.5 text-[11px] font-semibold uppercase tracking-wide cursor-pointer border-b-2 ${
                  tab === t.id
                    ? "border-amber-700 text-stone-900"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.badge ? <span className="ml-1 text-amber-700">{t.badge}</span> : null}
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
    </div>
  );
}
