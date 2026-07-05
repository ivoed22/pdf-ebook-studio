import { useStudio } from "../store/useStudio";
import type { Issue, IssueFix } from "../core/validation/engine";
import { useT } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { Icon } from "./kit/Icon";
import type { PaletteColor } from "../types/project";

function applyFix(fix: IssueFix): void {
  const s = useStudio.getState();
  switch (fix.kind) {
    case "renumber":
      s.renumberPages(fix.language);
      break;
    case "set-page-field":
      s.setPageField(fix.pageId, fix.field, fix.value);
      break;
    case "page-palette-hex": {
      const page = s.project?.pages.find((p) => p.id === fix.pageId);
      const palette = page?.fields.palette;
      if (Array.isArray(palette)) {
        const next = (palette as PaletteColor[]).map((c, i) =>
          i === fix.index ? { ...c, hex: fix.hex } : c,
        );
        s.setPageField(fix.pageId, "palette", next);
      }
      break;
    }
    case "project-palette-hex": {
      const palettes = s.project?.palettes ?? [];
      s.setPalettes(
        palettes.map((p) =>
          p.id === fix.paletteId
            ? { ...p, colors: p.colors.map((c, i) => (i === fix.index ? { ...c, hex: fix.hex } : c)) }
            : p,
        ),
      );
      break;
    }
    case "remove-image":
      void s.removeImage(fix.filename);
      break;
  }
}

export default function QCPanel({ issues }: { issues: Issue[] }) {
  const selectPage = useStudio((s) => s.selectPage);
  const setActiveLanguage = useStudio((s) => s.setActiveLanguage);
  const project = useStudio((s) => s.project);
  const t = useT();

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const fixable = issues.filter((i) => i.fix);

  function jumpTo(issue: Issue) {
    if (!issue.pageId || !project) return;
    const page = project.pages.find((p) => p.id === issue.pageId);
    if (page) {
      setActiveLanguage(page.language);
      selectPage(page.id);
    }
  }

  function fixAll() {
    // Renumber fixes collapse to one per language; apply the rest one by one.
    const seenRenumber = new Set<string>();
    let applied = 0;
    for (const issue of fixable) {
      const fix = issue.fix!;
      if (fix.kind === "renumber") {
        if (seenRenumber.has(fix.language)) continue;
        seenRenumber.add(fix.language);
      }
      applyFix(fix);
      applied++;
    }
    toast.success(t("fixedN", { n: applied }));
  }

  return (
    <div className="p-4">
      {issues.length === 0 ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="font-semibold flex items-center gap-1.5">
            <Icon name="check" size={14} /> {t("qcAllPassed")}
          </p>
          <p className="text-xs mt-1">{t("qcAllPassedBody")}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-500 mb-3">
            {t("qcSummary", { e: errors.length, w: warnings.length })}
          </p>
          {fixable.length > 0 && (
            <button className="btn-primary w-full mb-3 text-xs" onClick={fixAll}>
              {t("fixAll", { n: fixable.length })}
            </button>
          )}
          {[...errors, ...warnings].map((issue, i) => (
            <div
              key={i}
              className={`rounded-md border p-2.5 mb-2 transition-colors ${
                issue.severity === "error"
                  ? "border-red-200 bg-red-50 hover:border-red-400"
                  : "border-amber-200 bg-amber-50 hover:border-amber-400"
              }`}
            >
              <button className="w-full text-left cursor-pointer" onClick={() => jumpTo(issue)}>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      issue.severity === "error" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  {issue.pageNumber && (
                    <span className="text-[10px] font-semibold text-stone-500">
                      P{issue.pageNumber}
                      {issue.language ? ` · ${issue.language.toUpperCase()}` : ""}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 ml-auto font-mono">{issue.code}</span>
                </div>
                <p className="text-xs text-stone-700 mt-1 leading-snug">{issue.message}</p>
              </button>
              {issue.fix && (
                <button
                  className="mt-1.5 inline-flex items-center gap-1 rounded bg-white border border-stone-300 px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:border-stone-500 cursor-pointer"
                  onClick={() => applyFix(issue.fix!)}
                >
                  <Icon name="check" size={11} /> {t("fix")}
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
