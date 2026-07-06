import { useStudio } from "../store/useStudio";
import { THEMES } from "../data/themes/themes";
import { PRODUCT_TYPES, type ProductType } from "../types/project";
import { useT } from "../i18n/strings";

export default function ProjectSettings() {
  const project = useStudio((s) => s.project);
  const updateProject = useStudio((s) => s.updateProject);
  const t = useT();

  if (!project) return null;
  const meta = project.projectMeta;

  return (
    <div className="p-4">
      <label className="label">{t("title")}</label>
      <input
        className="input mb-3"
        value={meta.title}
        onChange={(e) => updateProject((p) => (p.projectMeta.title = e.target.value))}
      />
      <label className="label">{t("subtitle")}</label>
      <input
        className="input mb-3"
        value={meta.subtitle ?? ""}
        onChange={(e) => updateProject((p) => (p.projectMeta.subtitle = e.target.value))}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("authorBrand")}</label>
          <input
            className="input mb-3"
            value={meta.author ?? ""}
            onChange={(e) => updateProject((p) => (p.projectMeta.author = e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t("year")}</label>
          <input
            className="input mb-3"
            value={meta.year ?? ""}
            onChange={(e) => updateProject((p) => (p.projectMeta.year = e.target.value))}
          />
        </div>
      </div>

      <label className="label">{t("productType")}</label>
      <select
        className="input mb-3 cursor-pointer"
        value={meta.productType}
        onChange={(e) => updateProject((p) => (p.projectMeta.productType = e.target.value as ProductType))}
      >
        {PRODUCT_TYPES.map((pt) => (
          <option key={pt} value={pt}>
            {pt}
          </option>
        ))}
      </select>

      <label className="label">{t("theme")}</label>
      <div className="grid grid-cols-1 gap-2 mb-3">
        {THEMES.map((th) => (
          <button
            key={th.id}
            className={`rounded-md border p-2.5 text-left cursor-pointer ${
              meta.theme === th.id ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-stone-400"
            }`}
            onClick={() =>
              updateProject((p) => {
                p.projectMeta.theme = th.id;
                delete p.projectMeta.themeColors;
              })
            }
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {th.defaultPalette.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-stone-800">{th.name}</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{th.description}</div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-stone-400 mb-3">{t("themeFineTuneHint")}</p>

      <label className="label">{t("outputProfile")}</label>
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
        {t("settingsFootnote")}
      </p>
    </div>
  );
}
