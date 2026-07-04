import { useState } from "react";
import { useStudio } from "../store/useStudio";
import {
  exportContactSheet,
  exportCustomerZip,
  exportFinalPdf,
  exportPagePreviews,
  exportSellerZip,
} from "../core/export/packs";
import { exportProjectJson } from "../core/export/projectJson";
import type { Language } from "../types/project";

export default function ExportPanel({ errors }: { errors: number }) {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [failure, setFailure] = useState("");
  const [language, setLanguage] = useState<Language | "all">("all");

  if (!project) return null;

  const languages: Language[] =
    language === "all" ? project.languageVersions : [language];

  async function run(job: () => Promise<void>) {
    setBusy(true);
    setFailure("");
    try {
      await job();
      setStep("Done — check your downloads.");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : String(e));
      setStep("");
    } finally {
      setBusy(false);
    }
  }

  const p = project;
  const onProgress = (s: string) => setStep(s);

  const exports: { label: string; hint: string; job: () => Promise<void> }[] = [
    {
      label: "Final PDF",
      hint: "High-quality vector A4 PDF — the file your customer receives.",
      job: async () => {
        for (const lang of languages) await exportFinalPdf(p, images, lang, onProgress);
      },
    },
    {
      label: "Page previews (ZIP)",
      hint: "Every page as a ~200 DPI JPG, for listings and social posts.",
      job: async () => {
        for (const lang of languages) await exportPagePreviews(p, images, lang, onProgress);
      },
    },
    {
      label: "Contact sheet (PDF)",
      hint: "All pages as thumbnails on A4 overview sheets.",
      job: async () => {
        for (const lang of languages) await exportContactSheet(p, images, lang, onProgress);
      },
    },
    {
      label: "Customer ZIP",
      hint: "Final PDF(s) + Read-Me — upload this to Etsy as the product file.",
      job: () => exportCustomerZip(p, images, languages, onProgress),
    },
    {
      label: "Seller ZIP / Etsy Listing Pack",
      hint: "PDFs, previews, contact sheet, listing title/description/tags, photos, QC reports.",
      job: () => exportSellerZip(p, images, languages, onProgress),
    },
  ];

  return (
    <div className="p-4">
      {errors > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 mb-4 text-xs text-red-700">
          <span className="font-semibold">{errors} QC error(s) open.</span> You can still export, but fix
          them first for a sellable result — see the QC tab.
        </div>
      )}

      {project.languageVersions.length > 1 && (
        <>
          <label className="label">Language version to export</label>
          <select
            className="input mb-4 cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language | "all")}
          >
            <option value="all">All languages (separate files)</option>
            {project.languageVersions.map((lang) => (
              <option key={lang} value={lang}>
                {lang === "en" ? "English" : "Nederlands"} only
              </option>
            ))}
          </select>
        </>
      )}

      <div className="space-y-2">
        {exports.map((e) => (
          <div key={e.label} className="rounded-md border border-stone-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{e.label}</div>
                <div className="text-[11px] text-stone-400 leading-snug mt-0.5">{e.hint}</div>
              </div>
              <button className="btn-primary text-xs shrink-0" disabled={busy} onClick={() => void run(e.job)}>
                Export
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-stone-200">
        <div className="panel-title mb-2">Project backup</div>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-xs"
            disabled={busy}
            onClick={() => void run(() => exportProjectJson(p, images, false))}
          >
            Export project JSON
          </button>
          <button
            className="btn-secondary text-xs"
            disabled={busy}
            onClick={() => void run(() => exportProjectJson(p, images, true))}
          >
            Export with images
          </button>
        </div>
        <p className="text-[11px] text-stone-400 mt-1.5">
          Re-import from the dashboard. "With images" embeds all uploads (bigger file, fully portable).
        </p>
      </div>

      {(busy || step) && (
        <p className="text-xs text-stone-500 mt-4">
          {busy && <span className="inline-block animate-pulse mr-1.5">●</span>}
          {step}
        </p>
      )}
      {failure && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 mt-3 text-xs text-red-700">
          Export failed: {failure}
        </div>
      )}
    </div>
  );
}
