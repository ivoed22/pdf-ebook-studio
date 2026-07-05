import { useState } from "react";
import { useStudio } from "../store/useStudio";
import { THEMES } from "../data/themes/themes";
import {
  PRODUCT_TYPES,
  createEmptyProject,
  newId,
  type Language,
  type ProductType,
} from "../types/project";
import { templatesForProductType } from "../core/templates/registry";
import { useT, type StringKey } from "../i18n/strings";

const TYPE_INFO: Record<ProductType, { label: StringKey; blurb: StringKey }> = {
  "recipe-ebook": { label: "typeRecipe", blurb: "typeRecipeBlurb" },
  "interior-magazine": { label: "typeInterior", blurb: "typeInteriorBlurb" },
  "exterior-magazine": { label: "typeExterior", blurb: "typeExteriorBlurb" },
  "general-ebook": { label: "typeGuide", blurb: "typeGuideBlurb" },
};

export default function ProjectWizard({ onClose }: { onClose: () => void }) {
  const createProject = useStudio((s) => s.createProject);
  const t = useT();
  const [title, setTitle] = useState("");
  const [productType, setProductType] = useState<ProductType>("interior-magazine");
  const [languages, setLanguages] = useState<Language[]>(["en"]);
  const [theme, setTheme] = useState(THEMES[0].id);

  function toggleLanguage(lang: Language) {
    setLanguages((prev) =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter((l) => l !== lang) : prev) : [...prev, lang],
    );
  }

  async function create() {
    const project = createEmptyProject({
      title: title.trim() || "Untitled Project",
      productType,
      theme,
      languageVersions: languages,
    });
    // Start each language version with a cover page so the preview isn't empty.
    const coverTemplate =
      templatesForProductType(productType).find((t) => t.id.includes("cover"))?.id ??
      "magazine-cover-editorial";
    for (const language of languages) {
      project.pages.push({
        id: newId(),
        pageNumber: 1,
        template: coverTemplate,
        language,
        fields: { title: project.projectMeta.title, subtitle: "" },
      });
    }
    await createProject(project);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-semibold text-stone-900 mb-5">{t("wizardTitle")}</h2>

        <label className="label">{t("projectTitleLabel")}</label>
        <input
          className="input mb-4"
          autoFocus
          placeholder="e.g. Hotel Chic Bedroom Collection 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="label">{t("productType")}</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRODUCT_TYPES.map((pt) => (
            <button
              key={pt}
              className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                productType === pt
                  ? "border-amber-700 bg-amber-50"
                  : "border-stone-200 hover:border-stone-400"
              }`}
              onClick={() => setProductType(pt)}
            >
              <div className="text-sm font-semibold text-stone-800">{t(TYPE_INFO[pt].label)}</div>
              <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{t(TYPE_INFO[pt].blurb)}</div>
            </button>
          ))}
        </div>

        <label className="label">{t("languageVersions")}</label>
        <div className="flex gap-2 mb-4">
          {(["en", "nl"] as Language[]).map((lang) => (
            <button
              key={lang}
              className={`rounded-md border px-4 py-2 text-sm font-medium cursor-pointer ${
                languages.includes(lang)
                  ? "border-amber-700 bg-amber-50 text-stone-900"
                  : "border-stone-200 text-stone-500 hover:border-stone-400"
              }`}
              onClick={() => toggleLanguage(lang)}
            >
              {lang === "en" ? "English" : "Nederlands"}
            </button>
          ))}
          <span className="self-center text-[11px] text-stone-400">
            {t("langVersionHint")}
          </span>
        </div>

        <label className="label">{t("theme")}</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {THEMES.map((th) => (
            <button
              key={th.id}
              className={`rounded-md border p-2.5 text-left cursor-pointer ${
                theme === th.id ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-stone-400"
              }`}
              onClick={() => setTheme(th.id)}
            >
              <div className="flex gap-1 mb-1.5">
                {th.defaultPalette.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <div className="text-xs font-semibold text-stone-800">{th.name}</div>
              <div className="text-[10px] text-stone-500 leading-snug">{th.description}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary" onClick={() => void create()}>
            {t("createProject")}
          </button>
        </div>
        <p className="text-[11px] text-stone-400 mt-3">
          {t("wizardFootnote")}
        </p>
      </div>
    </div>
  );
}
