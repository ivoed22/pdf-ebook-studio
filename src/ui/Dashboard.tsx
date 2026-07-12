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
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "title">("recent");
  const mdInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const agentPackInput = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? projects.filter((p) => p.projectMeta.title.toLowerCase().includes(q)) : projects;
    return [...filtered].sort((a, b) => sort === "title"
      ? a.projectMeta.title.localeCompare(b.projectMeta.title)
      : b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, search, sort]);

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
            <LangToggle />
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
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold"><Icon name="cloud" size={15} /> Automatisch opgeslagen</span>
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="btn-secondary" onClick={() => setImportOpen(true)}><Icon name="folder" size={17} /> Importeren</button>
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
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState onSample={(which) => void importMarkdownText(which === "interior" ? interiorSample : recipeSample)} onNew={() => setWizardOpen(true)} />
        ) : (
          <section aria-label="Projecten" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => void openProject(project.id)}
                onDuplicate={() => void duplicateProject(project.id, t("projectCopy"))}
                onDelete={async () => {
                  const ok = await confirmDialog({ title: t("deleteProjectQ"), message: t("deleteProjectBody", { name: project.projectMeta.title }), confirmLabel: t("delete"), danger: true });
                  if (ok) void removeProject(project.id);
                }}
              />
            ))}
          </section>
        )}
      </main>

      <input ref={mdInput} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then(importMarkdownText); event.target.value = ""; }} />
      <input ref={jsonInput} type="file" accept=".json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onJsonFile(file); event.target.value = ""; }} />
      <input ref={agentPackInput} type="file" accept=".zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onAgentPackFile(file); event.target.value = ""; }} />

      {wizardOpen && <ProjectWizard onClose={() => setWizardOpen(false)} />}
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

function ProjectCard({ project, onOpen, onDuplicate, onDelete }: { project: Project; onOpen: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const t = useT();
  const [thumb, setThumb] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
          <h2 className="truncate font-display text-xl font-semibold text-[var(--ink)]">{project.projectMeta.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{project.pages.length} {t("pages")} · {project.languageVersions.map((language) => language.toUpperCase()).join(" + ")}</p>
        </div>
      </button>
      <div className="relative flex min-h-14 items-center justify-between px-4 pb-3">
        <span className="text-xs text-[var(--muted)]">{t("updated")} {new Date(project.updatedAt).toLocaleDateString()}</span>
        <button className="icon-button" aria-label={`Acties voor ${project.projectMeta.title}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name="more" size={19} /></button>
        {menuOpen && <div className="absolute bottom-12 right-3 z-10 min-w-40 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-xl"><button className="btn-ghost w-full justify-start" onClick={() => { setMenuOpen(false); onDuplicate(); }}><Icon name="copy" size={16} />{t("duplicate")}</button><button className="btn-ghost w-full justify-start text-red-700" onClick={() => { setMenuOpen(false); onDelete(); }}><Icon name="trash" size={16} />{t("delete")}</button></div>}
      </div>
    </article>
  );
}

function EmptyState({ onSample, onNew }: { onSample: (which: "interior" | "recipe") => void; onNew: () => void }) {
  const t = useT();
  return <section className="studio-card p-5 sm:p-8"><div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><span className="studio-chip">SNEL STARTEN</span><h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{t("onboardTitle")}</h2><p className="mt-2 max-w-xl text-sm text-[var(--muted)]">Begin leeg of ontdek de volledige workflow met een visueel voorbeeldproject.</p></div><button className="btn-primary" onClick={onNew}>{t("newProject")}</button></div><div className="grid gap-4 md:grid-cols-2"><SampleCard title={t("loadInteriorSample")} body="Een editorial interieurmagazine met palettes, materialen en beeldrijke pagina’s." accent="from-[#e8558d] to-[#8c56eb]" onClick={() => onSample("interior")} /><SampleCard title={t("loadRecipeSample")} body="Een compleet receptenebook met bereiding, voeding en verkoopklare export." accent="from-[#f59e66] to-[#e8558d]" onClick={() => onSample("recipe")} /></div></section>;
}

function SampleCard({ title, body, accent, onClick }: { title: string; body: string; accent: string; onClick: () => void }) {
  return <button className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-left transition-all hover:border-[var(--primary)] hover:shadow-lg" onClick={onClick}><span className={`block h-24 bg-gradient-to-br ${accent} p-5`}><Icon name="sparkle" size={26} className="text-white" /></span><span className="block p-5"><strong className="font-display text-xl text-[var(--ink)]">{title}</strong><span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">{body}</span><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">Voorbeeld openen <Icon name="right" size={15} /></span></span></button>;
}

function PasteMarkdownModal({ onClose, onImport }: { onClose: () => void; onImport: (text: string) => void }) {
  const t = useT();
  const [text, setText] = useState("");
  return <Dialog title={t("pasteMarkdownTitle")} description={t("pasteMarkdownHint")} onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>{t("cancel")}</button><button className="btn-primary" disabled={!text.trim()} onClick={() => onImport(text)}>{t("importBtn")}</button></>}><label className="label" htmlFor="markdown-content">Markdown</label><textarea id="markdown-content" className="input min-h-80 font-mono text-sm" value={text} onChange={(event) => setText(event.target.value)} placeholder={"---\nprojectTitle: …\nproductType: interior-magazine\n---\n\n<!-- PAGE -->\npageNumber: 1\n…"} /></Dialog>;
}
