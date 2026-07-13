import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import { importMarkdown } from "../core/markdown/importer";
import ProjectWizard from "./ProjectWizard";
import interiorSample from "../data/samples/interior-magazine-sample.md?raw";
import recipeSample from "../data/samples/recipe-ebook-sample.md?raw";
import type { Project } from "../types/project";
import * as db from "../core/storage/db";
import { useT, type StringKey } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { confirmDialog } from "./kit/ConfirmDialog";
import { Dialog } from "./kit/Dialog";
import { Icon } from "./kit/Icon";
import { LangToggle } from "./kit/LangToggle";
import { ProductionProgress } from "./ProductionProgress";
import { StorageManager } from "./StorageManager";
import { OverflowMenu } from "./kit/OverflowMenu";

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
  const updateStoredProject = useStudio((s) => s.updateStoredProject);
  const t = useT();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "title">("recent");
  const [view, setView] = useState<"active" | "favorites" | "archived">("active");
  const [folder, setFolder] = useState("all");
  const mdInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const agentPackInput = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesQuery = !q || project.projectMeta.title.toLowerCase().includes(q) || (project.organization?.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      const matchesView = view === "archived" ? project.organization?.archived : !project.organization?.archived && (view !== "favorites" || project.organization?.favorite);
      return matchesQuery && matchesView && (folder === "all" || project.organization?.folder === folder);
    });
    return [...filtered].sort((a, b) => sort === "title"
      ? a.projectMeta.title.localeCompare(b.projectMeta.title)
      : b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, search, sort, view, folder]);
  const folders = useMemo(() => [...new Set(projects.map((project) => project.organization?.folder).filter((value): value is string => Boolean(value)))].sort(), [projects]);

  async function importMarkdownText(text: string) {
    const { project, warnings } = importMarkdown(text);
    for (const warning of warnings) toast.info(warning);
    await createProject(project);
    toast.success(`"${project.projectMeta.title}" ✓`);
  }

  async function onJsonFile(file: File) {
    try {
      const { importProjectJson } = await import("../core/export/projectJson");
      const { project, images, warnings } = importProjectJson(await file.text());
      for (const warning of warnings) toast.info(warning);
      for (const asset of images) await db.saveImage(project.id, asset);
      await createProject(project);
      toast.success(`"${project.projectMeta.title}" ✓`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    }
  }

  async function onAgentPackFile(file: File) {
    try {
      const { importAgentPack } = await import("../core/import/agentPack");
      const { project, images, warnings } = await importAgentPack(file);
      for (const warning of warnings) toast.info(warning);
      for (const asset of images) await db.saveImage(project.id, asset);
      await createProject(project);
      toast.success(`"${project.projectMeta.title}" ${t("agentPackImported")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Agent pack import failed.");
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[#f7c5da] shadow-lg">
              <Icon name="logo" size={21} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold text-[var(--ink)] sm:text-2xl">PDF Ebook Studio</h1>
              <p className="hidden truncate text-sm text-[var(--muted)] sm:block">{t("appTagline")}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="icon-button" aria-label="Lokale opslag en backups" onClick={() => setStorageOpen(true)}><Icon name="folder" size={18} /></button><LangToggle />
            <button className="btn-primary" onClick={() => setWizardOpen(true)}>{t("newProject")}</button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[28px] bg-[var(--surface-strong)] px-5 py-7 text-white shadow-[var(--shadow-lg)] sm:px-8 sm:py-9">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
            <div>
              <span className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f7c5da]">CREATIVE WORKSPACE</span>
              <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-5xl">Van content naar een verkoopbaar ebook, in één studio.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">Ontwerp, controleer en exporteer professionele PDF’s zonder dat je bestanden je browser verlaten.</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold"><Icon name="lock" size={15} /> Local-first</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold"><Icon name="folder" size={15} /> Lokaal opgeslagen in deze browser</span>
            </div>
          </div>
        </section>

        <section className="studio-card mb-6 p-4 sm:p-5" aria-labelledby="quick-start-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="quick-start-title" className="font-display text-xl font-semibold text-[var(--ink)] sm:text-2xl">{t("quickStartTitle")}</h2>
                <span className="studio-chip">{t("recommendedAgentPack")}</span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{t("quickStartBody")}</p>
            </div>
            <div className="grid shrink-0 gap-2 sm:grid-cols-3">
              <button className="btn-primary justify-center" onClick={() => setWizardOpen(true)}>{t("newProject")}</button>
              <button className="btn-secondary justify-center" onClick={() => setImportOpen(true)}><Icon name="folder" size={17} /> {t("importProject")}</button>
              <button className="btn-secondary justify-center border-[var(--primary)] text-[var(--primary)]" onClick={() => agentPackInput.current?.click()}><Icon name="export" size={17} /> {t("importAgentPackDirect")}</button>
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {projects.length > 0 && (
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:ml-auto sm:flex-row sm:justify-end">
              <label className="min-w-0 sm:w-64">
                <span className="sr-only">{t("searchProjects")}</span>
                <input className="input" placeholder={t("searchProjects")} value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <label>
                <span className="sr-only">Sorteren</span>
                <select className="input sm:w-auto" value={sort} onChange={(event) => setSort(event.target.value as "recent" | "title")}>
                  <option value="recent">{t("sortRecent")}</option>
                  <option value="title">{t("sortTitle")}</option>
                </select>
              </label>
              {folders.length > 0 && <label><span className="sr-only">Map</span><select className="input sm:w-auto" value={folder} onChange={(event) => setFolder(event.target.value)}><option value="all">Alle mappen</option>{folders.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}
            </div>
          )}
        </div>

        {projects.length > 0 && <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Projectweergave">{([["active", "Actief"], ["favorites", "Favorieten"], ["archived", "Archief"]] as const).map(([value, label]) => <button key={value} className={`studio-chip whitespace-nowrap ${view === value ? "ring-2 ring-[var(--primary)]" : ""}`} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>}

        {projects.length === 0 ? (
          <section className="studio-card mb-6 px-5 py-6 sm:px-7" aria-labelledby="empty-library-title">
            <h2 id="empty-library-title" className="font-display text-2xl font-semibold text-[var(--ink)]">{t("noProjects")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{t("noProjectsBody")}</p>
          </section>
        ) : (
          <section aria-label="Projecten" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => void openProject(project.id)}
                onDuplicate={() => void duplicateProject(project.id, t("projectCopy"))}
                onFavorite={() => void updateStoredProject(project.id, (draft) => { draft.organization ??= { tags: [], favorite: false, archived: false }; draft.organization.favorite = !draft.organization.favorite; })}
                onArchive={() => void updateStoredProject(project.id, (draft) => { draft.organization ??= { tags: [], favorite: false, archived: false }; draft.organization.archived = !draft.organization.archived; })}
                onDelete={async () => {
                  const ok = await confirmDialog({ title: t("deleteProjectQ"), message: t("deleteProjectBody", { name: project.projectMeta.title }), confirmLabel: t("delete"), danger: true });
                  if (ok) void removeProject(project.id);
                }}
              />
            ))}
          </section>
        )}

        <ExampleProjects compact={projects.length > 0} onSample={(which) => void importMarkdownText(which === "interior" ? interiorSample : recipeSample)} />
      </main>

      <input ref={mdInput} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then(importMarkdownText); event.target.value = ""; }} />
      <input ref={jsonInput} type="file" accept=".json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onJsonFile(file); event.target.value = ""; }} />
      <input ref={agentPackInput} type="file" accept=".zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onAgentPackFile(file); event.target.value = ""; }} />

      {wizardOpen && <ProjectWizard onClose={() => setWizardOpen(false)} />}
      {storageOpen && <StorageManager onClose={() => setStorageOpen(false)} />}
      {pasteOpen && <PasteMarkdownModal onClose={() => setPasteOpen(false)} onImport={(text) => { setPasteOpen(false); void importMarkdownText(text); }} />}
      {importOpen && (
        <Dialog title="Project importeren" description="Kies het formaat dat je al hebt." onClose={() => setImportOpen(false)} maxWidth="max-w-lg">
          <div className="grid gap-3">
            <ImportChoice icon="page" title={t("importMarkdown")} body="Open een voorbereid Markdown- of tekstbestand." onClick={() => { setImportOpen(false); mdInput.current?.click(); }} />
            <ImportChoice icon="edit" title={t("pasteMarkdown")} body="Plak frontmatter en paginablokken rechtstreeks in de studio." onClick={() => { setImportOpen(false); setPasteOpen(true); }} />
            <ImportChoice icon="folder" title={t("importJson")} body="Herstel een eerder geëxporteerde projectback-up." onClick={() => { setImportOpen(false); jsonInput.current?.click(); }} />
            <ImportChoice icon="export" title={t("importAgentPack")} body="Importeer projectdata en afbeeldingen als één ZIP-pakket." onClick={() => { setImportOpen(false); agentPackInput.current?.click(); }} />
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ImportChoice({ icon, title, body, onClick }: { icon: string; title: string; body: string; onClick: () => void }) {
  return <button className="flex min-h-20 items-center gap-4 rounded-2xl border border-[var(--border)] p-4 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]" onClick={onClick}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon name={icon} size={20} /></span><span><strong className="block text-sm text-[var(--ink)]">{title}</strong><span className="mt-0.5 block text-sm text-[var(--muted)]">{body}</span></span></button>;
}

function ProjectCard({ project, onOpen, onDuplicate, onDelete, onFavorite, onArchive }: { project: Project; onOpen: () => void; onDuplicate: () => void; onDelete: () => void; onFavorite: () => void; onArchive: () => void }) {
  const t = useT();
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void import("../core/thumbs").then(({ getCoverThumb }) => getCoverThumb(project, (dataUrl) => alive && setThumb(dataUrl)));
    return () => { alive = false; };
  }, [project, project.updatedAt]);
  return (
    <article className="studio-card group overflow-hidden transition-transform hover:-translate-y-0.5">
      <button className="block w-full text-left" onClick={onOpen} aria-label={`${project.projectMeta.title} openen`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-soft)]">
          {thumb ? <img src={thumb} alt={`Cover van ${project.projectMeta.title}`} className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]" /> : <span className="flex h-full items-center justify-center text-[var(--primary)]"><Icon name="page" size={38} strokeWidth={1.3} /></span>}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[var(--primary-strong)] shadow-sm">{t(TYPE_LABEL_KEY[project.projectMeta.productType])}</span>
        </div>
          <div className="px-4 pb-2 pt-4">
          <h2 className="truncate font-display text-xl font-semibold text-[var(--ink)]">{project.organization?.favorite ? "★ " : ""}{project.projectMeta.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{project.pages.length} {t("pages")} · {project.languageVersions.map((language) => language.toUpperCase()).join(" + ")}</p>
          {(project.organization?.folder || (project.organization?.tags?.length ?? 0) > 0) && <p className="mt-2 truncate text-xs text-[var(--muted)]">{[project.organization?.folder, ...(project.organization?.tags ?? []).map((tag) => `#${tag}`)].filter(Boolean).join(" · ")}</p>}
          </div>
          <div className="px-4 pb-3"><ProductionProgress project={project} compact /></div>
      </button>
      <div className="relative flex min-h-14 items-center justify-between px-4 pb-3">
        <span className="text-xs text-[var(--muted)]">{t("updated")} {new Date(project.updatedAt).toLocaleDateString()}</span>
        <OverflowMenu label={`Acties voor ${project.projectMeta.title}`}><button role="menuitem" className="btn-ghost w-full justify-start" onClick={onFavorite}>{project.organization?.favorite ? "Verwijder favoriet" : "Maak favoriet"}</button><button role="menuitem" className="btn-ghost w-full justify-start" onClick={onArchive}>{project.organization?.archived ? "Uit archief halen" : "Archiveren"}</button><button role="menuitem" className="btn-ghost w-full justify-start" onClick={onDuplicate}><Icon name="copy" size={16} />{t("duplicate")}</button><button role="menuitem" className="btn-ghost w-full justify-start text-[var(--danger)]" onClick={onDelete}><Icon name="trash" size={16} />{t("delete")}</button></OverflowMenu>
      </div>
    </article>
  );
}

function ExampleProjects({ onSample, compact }: { onSample: (which: "interior" | "recipe") => void; compact: boolean }) {
  const t = useT();
  const cards = <div className="grid gap-4 md:grid-cols-2"><SampleCard title={t("loadInteriorSample")} body={t("interiorSampleBody")} accent="from-[#e8558d] to-[#8c56eb]" onClick={() => onSample("interior")} /><SampleCard title={t("loadRecipeSample")} body={t("recipeSampleBody")} accent="from-[#f59e66] to-[#e8558d]" onClick={() => onSample("recipe")} /></div>;
  if (compact) return <details className="studio-card group mt-8 p-5 sm:p-6"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"><span><strong className="block font-display text-xl text-[var(--ink)]">{t("examplesTitle")}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{t("showExamples")}</span></span><Icon name="right" size={18} className="shrink-0 transition-transform group-open:rotate-90" /></summary><div className="mt-5 border-t border-[var(--border)] pt-5"><p className="mb-4 text-sm text-[var(--muted)]">{t("examplesBody")}</p>{cards}</div></details>;
  return <section className="studio-card p-5 sm:p-8" aria-labelledby="examples-title"><div className="mb-6"><span className="studio-chip">{t("onboardTitle")}</span><h2 id="examples-title" className="mt-3 font-display text-2xl font-semibold text-[var(--ink)] sm:text-3xl">{t("examplesTitle")}</h2><p className="mt-2 max-w-xl text-sm text-[var(--muted)]">{t("examplesBody")}</p></div>{cards}</section>;
}

function SampleCard({ title, body, accent, onClick }: { title: string; body: string; accent: string; onClick: () => void }) {
  const t = useT();
  return <button className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-left transition-all hover:border-[var(--primary)] hover:shadow-lg" onClick={onClick}><span className={`block h-24 bg-gradient-to-br ${accent} p-5`}><Icon name="sparkle" size={26} className="text-white" /></span><span className="block p-5"><strong className="font-display text-xl text-[var(--ink)]">{title}</strong><span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">{body}</span><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">{t("openSample")} <Icon name="right" size={15} /></span></span></button>;
}

function PasteMarkdownModal({ onClose, onImport }: { onClose: () => void; onImport: (text: string) => void }) {
  const t = useT();
  const [text, setText] = useState("");
  return <Dialog title={t("pasteMarkdownTitle")} description={t("pasteMarkdownHint")} onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>{t("cancel")}</button><button className="btn-primary" disabled={!text.trim()} onClick={() => onImport(text)}>{t("importBtn")}</button></>}><label className="label" htmlFor="markdown-content">Markdown</label><textarea id="markdown-content" className="input min-h-80 font-mono text-sm" value={text} onChange={(event) => setText(event.target.value)} placeholder={"---\nprojectTitle: …\nproductType: interior-magazine\n---\n\n<!-- PAGE -->\npageNumber: 1\n…"} /></Dialog>;
}
