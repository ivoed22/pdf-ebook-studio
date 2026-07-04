import { useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import { importMarkdown } from "../core/markdown/importer";
import { importProjectJson } from "../core/export/projectJson";
import ProjectWizard from "./ProjectWizard";
import interiorSample from "../data/samples/interior-magazine-sample.md?raw";
import recipeSample from "../data/samples/recipe-ebook-sample.md?raw";
import type { Project } from "../types/project";
import * as db from "../core/storage/db";

const TYPE_LABEL: Record<string, string> = {
  "recipe-ebook": "Recipe Ebook",
  "interior-magazine": "Interior Magazine",
  "exterior-magazine": "Exterior Magazine",
  "general-ebook": "General Ebook",
};

export default function Dashboard() {
  const projects = useStudio((s) => s.projects);
  const openProject = useStudio((s) => s.openProject);
  const createProject = useStudio((s) => s.createProject);
  const removeProject = useStudio((s) => s.removeProject);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [notice, setNotice] = useState<string[]>([]);
  const mdInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);

  async function importMarkdownText(text: string) {
    const { project, warnings } = importMarkdown(text);
    setNotice(warnings);
    await createProject(project);
  }

  async function onMarkdownFile(file: File) {
    await importMarkdownText(await file.text());
  }

  async function onJsonFile(file: File) {
    try {
      const { project, images, warnings } = importProjectJson(await file.text());
      setNotice(warnings);
      for (const asset of images) await db.saveImage(project.id, asset);
      await createProject(project);
    } catch (e) {
      setNotice([e instanceof Error ? e.message : "Import failed."]);
    }
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-stone-900">PDF Ebook Studio</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Turn prepared content and images into premium, sellable A4 PDFs.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setWizardOpen(true)}>
            + New project
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          <button className="btn-secondary" onClick={() => mdInput.current?.click()}>
            Import Markdown…
          </button>
          <button className="btn-secondary" onClick={() => jsonInput.current?.click()}>
            Import project JSON…
          </button>
          <span className="mx-2 self-center text-stone-300">|</span>
          <button className="btn-ghost" onClick={() => void importMarkdownText(interiorSample)}>
            Load interior sample
          </button>
          <button className="btn-ghost" onClick={() => void importMarkdownText(recipeSample)}>
            Load recipe sample
          </button>
          <input
            ref={mdInput}
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onMarkdownFile(f);
              e.target.value = "";
            }}
          />
          <input
            ref={jsonInput}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onJsonFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {notice.length > 0 && (
          <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {notice.map((n, i) => (
              <div key={i}>{n}</div>
            ))}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-stone-300 py-20 text-center text-stone-400">
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-1">
              Create a new project, import a Markdown file, or load one of the samples above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: Project) => (
              <div
                key={p.id}
                className="group rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => void openProject(p.id)}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                  {TYPE_LABEL[p.projectMeta.productType]}
                </div>
                <h2 className="font-display text-lg font-semibold text-stone-900 mt-1 leading-snug">
                  {p.projectMeta.title}
                </h2>
                <p className="text-xs text-stone-500 mt-2">
                  {p.pages.length} pages · {p.languageVersions.map((l) => l.toUpperCase()).join(" + ")} ·{" "}
                  {p.projectMeta.theme}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] text-stone-400">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    className="text-[11px] text-stone-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${p.projectMeta.title}"? This cannot be undone.`)) {
                        void removeProject(p.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {wizardOpen && <ProjectWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
