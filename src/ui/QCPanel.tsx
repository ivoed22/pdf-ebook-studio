import { useStudio } from "../store/useStudio";
import type { Issue } from "../core/validation/engine";

export default function QCPanel({ issues }: { issues: Issue[] }) {
  const selectPage = useStudio((s) => s.selectPage);
  const setActiveLanguage = useStudio((s) => s.setActiveLanguage);
  const project = useStudio((s) => s.project);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  function jumpTo(issue: Issue) {
    if (!issue.pageId || !project) return;
    const page = project.pages.find((p) => p.id === issue.pageId);
    if (page) {
      setActiveLanguage(page.language);
      selectPage(page.id);
    }
  }

  return (
    <div className="p-4">
      {issues.length === 0 ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="font-semibold">All checks passed</p>
          <p className="text-xs mt-1">
            Required fields, images, palettes, page numbering and text length all look good. Ready to
            export.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-500 mb-3">
            {errors.length} error(s) · {warnings.length} warning(s). Errors should be fixed before selling
            the export; warnings are advisory.
          </p>
          {[...errors, ...warnings].map((issue, i) => (
            <button
              key={i}
              className={`w-full text-left rounded-md border p-2.5 mb-2 cursor-pointer transition-colors ${
                issue.severity === "error"
                  ? "border-red-200 bg-red-50 hover:border-red-400"
                  : "border-amber-200 bg-amber-50 hover:border-amber-400"
              }`}
              onClick={() => jumpTo(issue)}
            >
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
                    Page {issue.pageNumber}
                    {issue.language ? ` · ${issue.language.toUpperCase()}` : ""}
                  </span>
                )}
                <span className="text-[10px] text-stone-400 ml-auto font-mono">{issue.code}</span>
              </div>
              <p className="text-xs text-stone-700 mt-1 leading-snug">{issue.message}</p>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
