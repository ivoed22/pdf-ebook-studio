import { useState } from "react";
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
import type { Language } from "../types/project";
import { useT, type StringKey } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { Icon } from "./kit/Icon";

export default function ExportPanel({ errors }: { errors: number }) {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [jobLabel, setJobLabel] = useState("");
  const [language, setLanguage] = useState<Language | "all">("all");

  if (!project) return null;

  const languages: Language[] = language === "all" ? project.languageVersions : [language];

  async function run(label: string, job: (onProgress: (s: string) => void) => Promise<void>) {
    setBusy(true);
    setJobLabel(label);
    setSteps([]);
    try {
      await job((s) => setSteps((prev) => [...prev, s]));
      toast.success(`${label} ✓ — ${t("exportDone")}`);
    } catch (e) {
      toast.error(t("exportFailed", { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
      setJobLabel("");
      setSteps([]);
    }
  }

  const p = project;

  const exports: { labelKey: StringKey; hintKey: StringKey; job: (op: (s: string) => void) => Promise<void> }[] = [
    {
      labelKey: "finalPdf",
      hintKey: "finalPdfHint",
      job: async (op) => {
        for (const lang of languages) await exportFinalPdf(p, images, lang, op);
      },
    },
    {
      labelKey: "pagePreviews",
      hintKey: "pagePreviewsHint",
      job: async (op) => {
        for (const lang of languages) await exportPagePreviews(p, images, lang, op);
      },
    },
    {
      labelKey: "contactSheet",
      hintKey: "contactSheetHint",
      job: async (op) => {
        for (const lang of languages) await exportContactSheet(p, images, lang, op);
      },
    },
    {
      labelKey: "etsyImages",
      hintKey: "etsyImagesHint",
      job: (op) => exportEtsyVisuals(p, images, languages, op),
    },
    {
      labelKey: "customerZip",
      hintKey: "customerZipHint",
      job: (op) => exportCustomerZip(p, images, languages, op),
    },
    {
      labelKey: "sellerZip",
      hintKey: "sellerZipHint",
      job: (op) => exportSellerZip(p, images, languages, op),
    },
  ];

  return (
    <div className="p-4">
      {errors > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 mb-4 text-xs text-red-700">
          {t("qcOpenErrors", { n: errors })}
        </div>
      )}

      {project.languageVersions.length > 1 && (
        <>
          <label className="label">{t("exportLangLabel")}</label>
          <select
            className="input mb-4 cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language | "all")}
          >
            <option value="all">{t("allLanguages")}</option>
            {project.languageVersions.map((lang) => (
              <option key={lang} value={lang}>
                {t("onlyLang", { lang: lang === "en" ? "English" : "Nederlands" })}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="space-y-2">
        {exports.map((e) => (
          <div key={e.labelKey} className="rounded-md border border-stone-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{t(e.labelKey)}</div>
                <div className="text-[11px] text-stone-400 leading-snug mt-0.5">{t(e.hintKey)}</div>
              </div>
              <button
                className="btn-primary text-xs shrink-0"
                disabled={busy}
                onClick={() => void run(t(e.labelKey), e.job)}
              >
                {t("exportBtn")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-stone-200">
        <div className="panel-title mb-2">{t("projectBackup")}</div>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-xs"
            disabled={busy}
            onClick={() => void run(t("exportProjectJson"), () => exportProjectJson(p, images, false))}
          >
            {t("exportProjectJson")}
          </button>
          <button
            className="btn-secondary text-xs"
            disabled={busy}
            onClick={() => void run(t("exportWithImages"), () => exportProjectJson(p, images, true))}
          >
            {t("exportWithImages")}
          </button>
        </div>
        <p className="text-[11px] text-stone-400 mt-1.5">{t("backupHint")}</p>
      </div>

      {busy && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="h-4 w-4 rounded-full border-2 border-stone-300 border-t-amber-700 animate-spin" />
              <h3 className="font-display font-semibold text-stone-900">
                {t("exporting")}: {jobLabel}
              </h3>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-stone-600 py-0.5">
                  {i === steps.length - 1 ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
                  ) : (
                    <Icon name="check" size={11} className="text-emerald-600 shrink-0" />
                  )}
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
