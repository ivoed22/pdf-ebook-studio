import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import { importMarkdown } from "../core/markdown/importer";
import { importProjectJson } from "../core/export/projectJson";
import { importAgentPack } from "../core/import/agentPack";
import { getCoverThumb } from "../core/thumbs";
import ProjectWizard from "./ProjectWizard";
import interiorSample from "../data/samples/interior-magazine-sample.md?raw";
import recipeSample from "../data/samples/recipe-ebook-sample.md?raw";
import type { Project } from "../types/project";
import * as db from "../core/storage/db";
import { useT, type StringKey } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { confirmDialog } from "./kit/ConfirmDialog";
import { Icon } from "./kit/Icon";
import { LangToggle } from "./kit/LangToggle";

const TYPE_LABEL_KEY: Record<string, StringKey> = {
  "recipe-ebook": "typeRecipe",
  "interior-magazine": "typeInterior",
  "exterior-magazine": "typeExterior",
  "general-ebook": "typeGuide",
};

export default function Dashboard() {
  const projects = useStudio((s) => s.projects);
  const openProject = useStudio((s) => s.openProject);
  const createProject = useStudio((s) => s.createProject);
  const removeProject = useStudio((s) => s.removeProject);
  const duplicateProject = useStudio((s) => s.duplicateProject);
  const t = useT();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "title">("recent");
  const mdInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const agentPackInput = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? projects.filter((p) => p.projectMeta.title.toLowerCase().includes(q))
      : projects;
    return [...filtered].sort((a, b) =>
      sort === "title"
        ? a.projectMeta.title.localeCompare(b.projectMeta.title)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  }, [projects, search, sort]);

  async function importMarkdownText(text: string) {
    const { project, warnings } = importMarkdown(text);
    for (const w of warnings) toast.info(w);
    await createProject(project);
    toast.success(`"${project.projectMeta.title}" ✓`);
  }

  async function onJsonFile(file: File) {
    try {
      const { project, images, warnings } = importProjectJson(await file.text());
      for (const w of warnings) toast.info(w);
      for (const asset of images) await db.saveImage(project.id, asset);
      await createProject(project);
      toast.success(`"${project.projectMeta.title}" ✓`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed.");
    }
  }

  async function onAgentPackFile(file: File) {
    try {
      const { project, images, warnings } = await importAgentPack(file);
      for (const w of warnings) toast.info(w);
      for (const asset of images) await db.saveImage(project.id, asset);
      await createProject(project);
      toast.success(`"${project.projectMeta.title}" ${t("agentPackImported")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Agent pack import failed.");
    }
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-9 w-9 rounded-lg bg-stone-900 text-amber-200 flex items-center justify-center shrink-0">
              <Icon name="logo" size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold text-stone-900 leading-tight">
                PDF Ebook Studio
              </h1>
              <p className="text-xs text-stone-500 truncate">{t("appTagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LangToggle />
            <button className="btn-primary" onClick={() => setWizardOpen(true)}>
              {t("newProject")}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button className="btn-secondary" onClick={() => mdInput.current?.click()}>
            {t("importMarkdown")}
          </button>
          <button className="btn-secondary" onClick={() => setPasteOpen(true)}>
            {t("pasteMarkdown")}
          </button>
          <button className="btn-secondary" onClick={() => jsonInput.current?.click()}>
            {t("importJson")}
          </button>
          <button className="btn-secondary" onClick={() => agentPackInput.current?.click()}>
            {t("importAgentPack")}
          </button>
          {projects.length > 0 && (
            <>
              <div className="ml-auto flex items-center gap-2">
                <input
                  className="input w-48"
                  placeholder={t("searchProjects")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="input w-auto cursor-pointer"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "recent" | "title")}
                >
                  <option value="recent">{t("sortRecent")}</option>
                  <option value="title">{t("sortTitle")}</option>
                </select>
              </div>
            </>
          )}
          <input
            ref={mdInput}
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void f.text().then(importMarkdownText);
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
          <input
            ref={agentPackInput}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onAgentPackFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {projects.length === 0 ? (
          <EmptyState
            onSample={(which) =>
              void importMarkdownText(which === "interior" ? interiorSample : recipeSample)
            }
            onNew={() => setWizardOpen(true)}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => void openProject(p.id)}
                  onDuplicate={() => void duplicateProject(p.id, t("projectCopy"))}
                  onDelete={async () => {
                    const ok = await confirmDialog({
                      title: t("deleteProjectQ"),
                      message: t("deleteProjectBody", { name: p.projectMeta.title }),
                      confirmLabel: t("delete"),
                      danger: true,
                    });
                    if (ok) void removeProject(p.id);
                  }}
                />
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-stone-400">
              <Icon name="sparkle" size={13} />
              <span>{t("tryASample")}</span>
              <button
                className="underline hover:text-stone-600 cursor-pointer"
                onClick={() => void importMarkdownText(interiorSample)}
              >
                {t("loadInteriorSample")}
              </button>
              <span>·</span>
              <button
                className="underline hover:text-stone-600 cursor-pointer"
                onClick={() => void importMarkdownText(recipeSample)}
              >
                {t("loadRecipeSample")}
              </button>
            </div>
          </>
        )}
      </main>

      {wizardOpen && <ProjectWizard onClose={() => setWizardOpen(false)} />}
      {pasteOpen && (
        <PasteMarkdownModal
          onClose={() => setPasteOpen(false)}
          onImport={(text) => {
            setPasteOpen(false);
            void importMarkdownText(text);
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getCoverThumb(project, (dataUrl) => {
      if (alive) setThumb(dataUrl);
    });
    return () => {
      alive = false;
    };
  }, [project, project.updatedAt]);

  return (
    <div
      className="group rounded-xl border border-stone-200 bg-white overflow-hidden hover:border-stone-400 hover:shadow-md transition-all cursor-pointer"
      onClick={onOpen}
    >
      <div className="aspect-[210/148] bg-stone-100 overflow-hidden relative">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <Icon name="page" size={28} strokeWidth={1.2} />
          </div>
        )}
        <span className="absolute top-2 left-2 rounded bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 shadow-sm">
          {t(TYPE_LABEL_KEY[project.projectMeta.productType])}
        </span>
      </div>
      <div className="p-3.5">
        <h2 className="font-display text-base font-semibold text-stone-900 leading-snug truncate">
          {project.projectMeta.title}
        </h2>
        <p className="text-[11px] text-stone-500 mt-1">
          {project.pages.length} {t("pages")} ·{" "}
          {project.languageVersions.map((l) => l.toUpperCase()).join(" + ")}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-stone-400">
            {t("updated")} {new Date(project.updatedAt).toLocaleDateString()}
          </span>
          <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              title={t("duplicate")}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Icon name="copy" size={13} />
            </button>
            <button
              className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
              title={t("delete")}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Icon name="trash" size={13} />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onSample,
  onNew,
}: {
  onSample: (which: "interior" | "recipe") => void;
  onNew: () => void;
}) {
  const t = useT();
  const steps: [StringKey, StringKey, string][] = [
    ["onboard1Title", "onboard1Body", "page"],
    ["onboard2Title", "onboard2Body", "check"],
    ["onboard3Title", "onboard3Body", "sparkle"],
  ];
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8">
      <h2 className="font-display text-xl font-semibold text-stone-900 mb-6">{t("onboardTitle")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {steps.map(([titleKey, bodyKey, icon]) => (
          <div key={titleKey} className="rounded-xl bg-stone-50 border border-stone-100 p-4">
            <span className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Icon name={icon} size={15} />
            </span>
            <div className="text-sm font-semibold text-stone-800">{t(titleKey)}</div>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{t(bodyKey)}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={onNew}>
          {t("newProject")}
        </button>
        <button className="btn-secondary" onClick={() => onSample("interior")}>
          {t("loadInteriorSample")}
        </button>
        <button className="btn-secondary" onClick={() => onSample("recipe")}>
          {t("loadRecipeSample")}
        </button>
      </div>
    </div>
  );
}

function PasteMarkdownModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (text: string) => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">
          {t("pasteMarkdownTitle")}
        </h2>
        <p className="text-xs text-stone-500 mb-3">{t("pasteMarkdownHint")}</p>
        <textarea
          className="input font-mono text-xs"
          rows={16}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"---\nprojectTitle: …\nproductType: interior-magazine\n---\n\n<!-- PAGE -->\npageNumber: 1\ntemplate: magazine-cover-editorial\n…"}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary" disabled={!text.trim()} onClick={() => onImport(text)}>
            {t("importBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
