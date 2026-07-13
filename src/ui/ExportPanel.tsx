import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { useStudio } from "../store/useStudio";
import {
  exportContactSheet,
  exportCustomerZip,
  exportEtsyVisuals,
  exportFinalPdf,
  exportPagePreviews,
  exportSellerZip,
} from "../core/export/packs";
import { exportProjectJson } from "../core/export/projectJson";
import { renderProjectPdf, slugify } from "../core/export/renderPdf";
import * as db from "../core/storage/db";
import type { Language } from "../types/project";
import { useT, type StringKey } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { Icon } from "./kit/Icon";

type ExportJob = (onProgress: (step: string) => void, version: number) => Promise<void>;

export default function ExportPanel({ errors }: { errors: number }) {
  const project = useStudio((state) => state.project);
  const images = useStudio((state) => state.images);
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [jobLabel, setJobLabel] = useState("");
  const [language, setLanguage] = useState<Language | "all">("all");
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [history, setHistory] = useState<db.ExportHistoryRecord[]>([]);
  const [retryJob, setRetryJob] = useState<{ label: string; job: ExportJob; qcStatus: "pass" | "draft" } | null>(null);
  const cancelRequested = useRef(false);

  useEffect(() => {
    if (project) void db.loadExportHistory(project.id).then(setHistory);
  }, [project?.id]);

  if (!project) return null;
  const p = project;
  const languages: Language[] = language === "all" ? p.languageVersions : [language];
  const nextVersion = Math.max(0, ...history.map((item) => item.version)) + 1;

  async function run(label: string, job: ExportJob, qcStatus: "pass" | "draft" = "pass") {
    setBusy(true);
    setJobLabel(label);
    setSteps([]);
    setRetryJob(null);
    cancelRequested.current = false;
    const version = Math.max(0, ...history.map((item) => item.version)) + 1;
    try {
      await job((step) => { if (cancelRequested.current) throw new Error("Export geannuleerd"); setSteps((previous) => [...previous, step]); }, version);
      if (cancelRequested.current) throw new Error("Export geannuleerd");
      const filename = `${slugify(p.projectMeta.title)}-${slugify(label)}-v${String(version).padStart(2, "0")}`;
      const record = await db.saveExportHistory({ projectId: p.id, languages, profile: label, qcStatus, version, filename });
      setHistory((items) => [record, ...items]);
      toast.success(`${label} — ${t("exportDone")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "Export geannuleerd") toast.info(message);
      else { toast.error(t("exportFailed", { msg: message })); setRetryJob({ label, job, qcStatus }); }
    } finally {
      setBusy(false);
      setJobLabel("");
      setSteps([]);
    }
  }

  const exports: { labelKey: StringKey; hintKey: StringKey; job: ExportJob }[] = [
    { labelKey: "finalPdf", hintKey: "finalPdfHint", job: async (progress, version) => { for (const lang of languages) await exportFinalPdf(p, images, lang, progress, version); } },
    { labelKey: "pagePreviews", hintKey: "pagePreviewsHint", job: async (progress, version) => { for (const lang of languages) await exportPagePreviews(p, images, lang, progress, version); } },
    { labelKey: "contactSheet", hintKey: "contactSheetHint", job: async (progress, version) => { for (const lang of languages) await exportContactSheet(p, images, lang, progress, version); } },
    { labelKey: "etsyImages", hintKey: "etsyImagesHint", job: (progress, version) => exportEtsyVisuals(p, images, languages, progress, version) },
    { labelKey: "customerZip", hintKey: "customerZipHint", job: (progress, version) => exportCustomerZip(p, images, languages, progress, version) },
    { labelKey: "sellerZip", hintKey: "sellerZipHint", job: (progress, version) => exportSellerZip(p, images, languages, progress, version) },
  ];

  const draftJob: ExportJob = async (progress, version) => {
    for (const lang of languages) {
      progress(`Concept ${lang.toUpperCase()} renderen`);
      const blob = await renderProjectPdf(p, images, lang, { draft: true });
      saveAs(blob, `${slugify(p.projectMeta.title)}-${lang}-draft-v${String(version).padStart(2, "0")}.pdf`);
    }
  };

  return (
    <div className="p-4">
      {errors > 0 && <div className="status-danger mb-4 rounded-xl border border-transparent p-3 text-sm"><strong>Productie-export geblokkeerd.</strong><p className="mt-1 text-xs">Los {errors} QC-fout(en) op of maak bewust een concept met DRAFT-markering.</p><button className="btn-secondary mt-3" disabled={busy} onClick={() => void run("Concept PDF", draftJob, "draft")}>Exporteer concept</button></div>}

      {p.languageVersions.length > 1 && <><label className="label">{t("exportLangLabel")}</label><select className="input mb-4 cursor-pointer" value={language} onChange={(event) => setLanguage(event.target.value as Language | "all")}><option value="all">{t("allLanguages")}</option>{p.languageVersions.map((lang) => <option key={lang} value={lang}>{t("onlyLang", { lang: lang === "en" ? "English" : "Nederlands" })}</option>)}</select></>}

      <div className="space-y-2">{exports.map((item) => <div key={item.labelKey} className="rounded-xl border border-[var(--border)] p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-[var(--ink)]">{t(item.labelKey)}</div><div className="mt-0.5 text-xs leading-snug text-[var(--muted)]">{t(item.hintKey)}</div></div><button className="btn-primary shrink-0 text-xs" disabled={busy || errors > 0} onClick={() => { setPreflightOpen(true); setJobLabel(t(item.labelKey)); }}>{t("exportBtn")}</button></div></div>)}</div>

      <div className="mt-5 border-t border-[var(--border)] pt-4"><div className="panel-title mb-2">{t("projectBackup")}</div><div className="flex gap-2"><button className="btn-secondary text-xs" disabled={busy} onClick={() => void run(t("exportProjectJson"), () => exportProjectJson(p, images, false))}>{t("exportProjectJson")}</button><button className="btn-secondary text-xs" disabled={busy} onClick={() => void run(t("exportWithImages"), () => exportProjectJson(p, images, true))}>{t("exportWithImages")}</button></div><p className="mt-1.5 text-xs text-[var(--muted)]">{t("backupHint")}</p></div>

      {retryJob && <button className="btn-secondary mt-4 w-full" onClick={() => void run(retryJob.label, retryJob.job, retryJob.qcStatus)}>Mislukte export opnieuw proberen</button>}

      {p.projectMeta.outputProfile === "etsy-digital-product" && <ListingEditor />}

      <section className="mt-5 border-t border-[var(--border)] pt-4"><p className="panel-title">Exportgeschiedenis</p>{history.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Nog geen exports geregistreerd.</p> : <ul className="mt-3 space-y-2">{history.slice(0, 8).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-soft)] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.profile} · v{String(item.version).padStart(2, "0")}</p><p className="text-xs text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()} · {item.languages.map((lang) => lang.toUpperCase()).join("+")}</p></div><span className={item.qcStatus === "draft" ? "status-warning rounded-full px-2 py-1 text-xs font-semibold" : "status-success rounded-full px-2 py-1 text-xs font-semibold"}>{item.qcStatus === "draft" ? "DRAFT" : "QC OK"}</span></li>)}</ul>}</section>

      {busy && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#160f2b]/55 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)]" role="dialog" aria-modal="true" aria-labelledby="export-progress-title" aria-describedby="export-progress-status"><div className="mb-3 flex items-center gap-2.5"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" /><h3 id="export-progress-title" className="font-display font-semibold text-[var(--ink)]">{t("exporting")}: {jobLabel}</h3></div><p className="mb-2 text-xs text-[var(--muted)]">Stap {Math.max(1, steps.length)} · zware renderstappen worden veilig afgerond voor annulering.</p><div id="export-progress-status" className="max-h-52 overflow-y-auto" role="status" aria-live="polite">{steps.map((step, index) => <div key={`${step}-${index}`} className="flex items-center gap-2 py-0.5 text-xs text-[var(--muted)]">{index === steps.length - 1 ? <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--primary)]" /> : <Icon name="check" size={11} className="shrink-0 text-[var(--success)]" />}{step}</div>)}</div><button className="btn-secondary mt-4 w-full" onClick={() => { cancelRequested.current = true; toast.info("Export stopt na de huidige renderstap"); }}>Annuleer export</button></div></div>}

      {preflightOpen && !busy && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#160f2b]/55 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-label="Exportpreflight" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)]"><p className="panel-title">Productiepreflight</p><h3 className="mt-1 font-display text-2xl font-semibold">{jobLabel}</h3><dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[var(--surface-soft)] p-4 text-sm"><div><dt className="text-[var(--muted)]">Versie</dt><dd className="font-semibold">v{String(nextVersion).padStart(2, "0")}</dd></div><div><dt className="text-[var(--muted)]">Talen</dt><dd className="font-semibold">{languages.map((item) => item.toUpperCase()).join(", ")}</dd></div><div><dt className="text-[var(--muted)]">Pagina's</dt><dd className="font-semibold">{p.pages.filter((page) => languages.includes(page.language)).length}</dd></div><div><dt className="text-[var(--muted)]">Afbeeldingen</dt><dd className="font-semibold">{images.size}</dd></div><div><dt className="text-[var(--muted)]">QC</dt><dd className="font-semibold text-[var(--success)]">Geen fouten</dd></div></dl><div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setPreflightOpen(false)}>Annuleer</button><button className="btn-primary" onClick={() => { const item = exports.find((entry) => t(entry.labelKey) === jobLabel); setPreflightOpen(false); if (item) void run(jobLabel, item.job); }}>Start productie-export</button></div></div></div>}
    </div>
  );
}

function ListingEditor() {
  const project = useStudio((state) => state.project)!;
  const updateProject = useStudio((state) => state.updateProject);
  const [language, setLanguage] = useState<Language>(project.languageVersions[0]);
  const listing = project.projectMeta.listing?.[language] ?? {};
  const update = (field: "title" | "description" | "contents" | "customerReadme" | "thumbnailOrder" | "tags", value: string | string[]) => updateProject((draft) => {
    draft.projectMeta.listing ??= {};
    draft.projectMeta.listing[language] ??= {};
    Object.assign(draft.projectMeta.listing[language], { [field]: value });
  });
  const tags = listing.tags ?? [];
  return <details className="mt-5 border-t border-[var(--border)] pt-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between"><span className="panel-title">Etsy listing editor</span><span className="text-xs text-[var(--muted)]">Titel, tags en klanttekst</span></summary><div className="mt-3"><label className="label">Taal</label><select className="input mb-3" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{project.languageVersions.map((lang) => <option key={lang} value={lang}>{lang.toUpperCase()}</option>)}</select><label className="label">Titel · {(listing.title ?? "").length}/140</label><input className="input mb-3" maxLength={140} value={listing.title ?? ""} onChange={(event) => update("title", event.target.value)} placeholder="Leeg laten voor automatisch voorstel" /><label className="label">Beschrijving</label><textarea className="input mb-3 min-h-32" value={listing.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder="Leeg laten voor automatisch voorstel" /><label className="label">Tags · {tags.length}/13</label><input className="input mb-3" value={tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim().slice(0, 20)).filter(Boolean).slice(0, 13))} placeholder="Maximaal 13 tags, gescheiden door komma's" /><label className="label">Inhoud van download</label><textarea className="input mb-3" rows={3} value={listing.contents ?? ""} onChange={(event) => update("contents", event.target.value)} /><label className="label">Customer README</label><textarea className="input mb-3 min-h-28" value={listing.customerReadme ?? ""} onChange={(event) => update("customerReadme", event.target.value)} placeholder="Leeg laten voor automatische README" /><label className="label">Thumbnailvolgorde</label><input className="input" value={(listing.thumbnailOrder ?? []).join(", ")} onChange={(event) => update("thumbnailOrder", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="01-cover.jpg, 02-inside.jpg" /></div></details>;
}
