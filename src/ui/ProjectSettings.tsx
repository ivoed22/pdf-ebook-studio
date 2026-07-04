import { useStudio } from "../store/useStudio";
import { THEMES } from "../data/themes/themes";
import { PRODUCT_TYPES, type ProductType } from "../types/project";

export default function ProjectSettings() {
  const project = useStudio((s) => s.project);
  const updateProject = useStudio((s) => s.updateProject);

  if (!project) return null;
  const meta = project.projectMeta;

  return (
    <div className="p-4">
      <label className="label">Title</label>
      <input
        className="input mb-3"
        value={meta.title}
        onChange={(e) => updateProject((p) => (p.projectMeta.title = e.target.value))}
      />
      <label className="label">Subtitle</label>
      <input
        className="input mb-3"
        value={meta.subtitle ?? ""}
        onChange={(e) => updateProject((p) => (p.projectMeta.subtitle = e.target.value))}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Author / brand</label>
          <input
            className="input mb-3"
            value={meta.author ?? ""}
            onChange={(e) => updateProject((p) => (p.projectMeta.author = e.target.value))}
          />
        </div>
        <div>
          <label className="label">Year</label>
          <input
            className="input mb-3"
            value={meta.year ?? ""}
            onChange={(e) => updateProject((p) => (p.projectMeta.year = e.target.value))}
          />
        </div>
      </div>

      <label className="label">Product type</label>
      <select
        className="input mb-3 cursor-pointer"
        value={meta.productType}
        onChange={(e) => updateProject((p) => (p.projectMeta.productType = e.target.value as ProductType))}
      >
        {PRODUCT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label className="label">Theme</label>
      <div className="grid grid-cols-1 gap-2 mb-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`rounded-md border p-2.5 text-left cursor-pointer ${
              meta.theme === t.id ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-stone-400"
            }`}
            onClick={() => updateProject((p) => (p.projectMeta.theme = t.id))}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {t.defaultPalette.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-stone-800">{t.name}</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{t.description}</div>
          </button>
        ))}
      </div>

      <label className="label">Output profile</label>
      <select
        className="input mb-3 cursor-pointer"
        value={meta.outputProfile}
        onChange={(e) =>
          updateProject((p) => (p.projectMeta.outputProfile = e.target.value as typeof meta.outputProfile))
        }
      >
        <option value="etsy-digital-product">Etsy digital product</option>
        <option value="standard-pdf">Standard PDF</option>
      </select>

      <p className="text-[11px] text-stone-400">
        Format: A4 portrait · Theme changes apply instantly to the live preview and all exports.
      </p>
    </div>
  );
}
