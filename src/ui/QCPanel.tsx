import { useStudio } from "../store/useStudio";
import type { Issue, IssueFix } from "../core/validation/engine";
import { useT } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { Icon } from "./kit/Icon";
import type { PaletteColor } from "../types/project";
import { confirmDialog } from "./kit/ConfirmDialog";
import { saveSnapshot } from "../core/storage/db";

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

  async function fixAll() {
    if (!project) return;
    const descriptions = fixable.map((issue) => `• ${issue.message}`).join("\n");
    const proceed = await confirmDialog({ title: "Voorgestelde QC-wijzigingen", message: descriptions, confirmLabel: "Voer veilige fixes uit" });
    if (!proceed) return;
    await saveSnapshot(project, "Voor QC bulkfix");
    // Renumber fixes collapse to one per language; apply the rest one by one.
    const seenRenumber = new Set<string>();
    let applied = 0;
    const destructive = fixable.filter((issue) => issue.fix?.kind === "remove-image");
    for (const issue of fixable) {
      const fix = issue.fix!;
      if (fix.kind === "remove-image") continue;
      if (fix.kind === "renumber") {
        if (seenRenumber.has(fix.language)) continue;
        seenRenumber.add(fix.language);
      }
      applyFix(fix);
      applied++;
    }
    if (destructive.length > 0) {
      const remove = await confirmDialog({ title: "Ongebruikte afbeeldingen verwijderen?", message: destructive.map((issue) => issue.message).join("\n"), confirmLabel: "Verwijder afbeeldingen", danger: true });
      if (remove) for (const issue of destructive) { applyFix(issue.fix!); applied++; }
    }
    toast.success(t("fixedN", { n: applied }));
  }

  return (
    <div className="p-4">
      {issues.length === 0 ? (
        <div className="status-success rounded-xl border border-transparent p-4 text-sm">
          <p className="font-semibold flex items-center gap-1.5">
            <Icon name="check" size={14} /> {t("qcAllPassed")}
          </p>
          <p className="text-xs mt-1">{t("qcAllPassedBody")}</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-[var(--muted)]">
            {t("qcSummary", { e: errors.length, w: warnings.length })}
          </p>
          {fixable.length > 0 && (
            <button className="btn-primary mb-3 w-full text-xs" onClick={() => void fixAll()}>
              {t("fixAll", { n: fixable.length })}
            </button>
          )}
          {[...errors, ...warnings].map((issue, i) => (
            <div
              key={i}
              className={`rounded-md border p-2.5 mb-2 transition-colors ${
                issue.severity === "error"
                  ? "status-danger border-transparent"
                  : "status-warning border-transparent"
              }`}
            >
              <button className="w-full text-left cursor-pointer" onClick={() => jumpTo(issue)}>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      issue.severity === "error" ? "bg-[var(--danger)] text-white" : "bg-[var(--warning)] text-[var(--ink)]"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  {issue.pageNumber && (
                    <span className="text-xs font-semibold text-[var(--muted)]">
                      P{issue.pageNumber}
                      {issue.language ? ` · ${issue.language.toUpperCase()}` : ""}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs text-[var(--muted)]">{issue.code}</span>
                </div>
                <p className="mt-1 text-xs leading-snug text-[var(--ink)]">{issue.message}</p>
              </button>
              {issue.fix && (
                <button
                  className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)] hover:border-[var(--primary)] cursor-pointer"
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
