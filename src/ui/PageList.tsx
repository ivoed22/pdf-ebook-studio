import { useStudio } from "../store/useStudio";
import { getTemplate, templatesForProductType } from "../core/templates/registry";

export default function PageList() {
  const project = useStudio((s) => s.project);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const selectPage = useStudio((s) => s.selectPage);
  const addPage = useStudio((s) => s.addPage);
  const duplicatePage = useStudio((s) => s.duplicatePage);
  const removePage = useStudio((s) => s.removePage);
  const movePage = useStudio((s) => s.movePage);
  const activeLanguage = useStudio((s) => s.activeLanguage);

  if (!project) return null;
  const pages = project.pages
    .filter((p) => p.language === activeLanguage)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  function handleAdd() {
    const defaultTemplate =
      templatesForProductType(project!.projectMeta.productType).find((t) => !t.outputOnly)?.id ??
      "guide-text-page";
    const nextNumber = pages.length ? Math.max(...pages.map((p) => p.pageNumber)) + 1 : 1;
    addPage({
      pageNumber: nextNumber,
      template: defaultTemplate,
      language: activeLanguage,
      fields: { title: `Page ${nextNumber}` },
    });
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="panel-title">Pages · {activeLanguage.toUpperCase()}</span>
        <button className="btn-ghost text-xs px-2 py-1" onClick={handleAdd}>
          + Add
        </button>
      </div>
      {pages.length === 0 && (
        <p className="text-xs text-stone-400 py-6 text-center">
          No pages in this language version yet.
        </p>
      )}
      <ul className="space-y-1">
        {pages.map((page, i) => {
          const selected = page.id === selectedPageId;
          const template = getTemplate(page.template);
          return (
            <li
              key={page.id}
              className={`group rounded-md border px-2.5 py-2 cursor-pointer transition-colors ${
                selected ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-stone-400"
              }`}
              onClick={() => selectPage(page.id)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    selected ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {page.pageNumber}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-stone-800 truncate">
                    {typeof page.fields.title === "string" && page.fields.title
                      ? page.fields.title
                      : "(untitled)"}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {template?.name ?? page.template ?? "no template"}
                  </div>
                </div>
              </div>
              <div className="mt-1 hidden group-hover:flex gap-1 justify-end">
                <button
                  className="text-[10px] text-stone-400 hover:text-stone-700 px-1"
                  disabled={i === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    movePage(page.id, -1);
                  }}
                >
                  ↑
                </button>
                <button
                  className="text-[10px] text-stone-400 hover:text-stone-700 px-1"
                  disabled={i === pages.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    movePage(page.id, 1);
                  }}
                >
                  ↓
                </button>
                <button
                  className="text-[10px] text-stone-400 hover:text-stone-700 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePage(page.id);
                  }}
                >
                  Copy
                </button>
                <button
                  className="text-[10px] text-stone-400 hover:text-red-600 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove page ${page.pageNumber}?`)) removePage(page.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
