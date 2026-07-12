import { useState } from "react";
import { useStudio } from "../store/useStudio";
import { THEMES } from "../data/themes/themes";
import { PRODUCT_TYPES, createEmptyProject, newId, type Language, type ProductType } from "../types/project";
import { templatesForProductType } from "../core/templates/registry";
import { useT, type StringKey } from "../i18n/strings";
import { Dialog } from "./kit/Dialog";
import { Icon } from "./kit/Icon";

const TYPE_INFO: Record<ProductType, { label: StringKey; blurb: StringKey; icon: string }> = {
  "recipe-ebook": { label: "typeRecipe", blurb: "typeRecipeBlurb", icon: "sparkle" },
  "interior-magazine": { label: "typeInterior", blurb: "typeInteriorBlurb", icon: "image" },
  "exterior-magazine": { label: "typeExterior", blurb: "typeExteriorBlurb", icon: "palette" },
  "general-ebook": { label: "typeGuide", blurb: "typeGuideBlurb", icon: "page" },
};

export default function ProjectWizard({ onClose }: { onClose: () => void }) {
  const createProject = useStudio((s) => s.createProject);
  const t = useT();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [productType, setProductType] = useState<ProductType>("interior-magazine");
  const [languages, setLanguages] = useState<Language[]>(["en"]);
  const [theme, setTheme] = useState(THEMES[0].id);

  function toggleLanguage(language: Language) {
    setLanguages((current) => current.includes(language)
      ? current.length > 1 ? current.filter((item) => item !== language) : current
      : [...current, language]);
  }

  async function create() {
    const project = createEmptyProject({ title: title.trim() || "Untitled Project", productType, theme, languageVersions: languages });
    const coverTemplate = templatesForProductType(productType).find((template) => template.id.includes("cover"))?.id ?? "magazine-cover-editorial";
    for (const language of languages) {
      project.pages.push({ id: newId(), pageNumber: 1, template: coverTemplate, language, fields: { title: project.projectMeta.title, subtitle: "" } });
    }
    await createProject(project);
    onClose();
  }

  const stepNames = ["Basis", "Product", "Talen & stijl", "Controle"];
  return (
    <Dialog
      title={t("wizardTitle")}
      description={`${step + 1} van 4 · ${stepNames[step]}`}
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={<><button className="btn-secondary" onClick={() => step === 0 ? onClose() : setStep((value) => value - 1)}>{step === 0 ? t("cancel") : "Vorige"}</button>{step < 3 ? <button className="btn-primary" onClick={() => setStep((value) => value + 1)}>Volgende <Icon name="right" size={16} /></button> : <button className="btn-primary" onClick={() => void create()}>{t("createProject")}</button>}</>}
    >
      <ol className="mb-7 grid grid-cols-4 gap-2" aria-label="Voortgang">
        {stepNames.map((name, index) => <li key={name} className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}><span className="sr-only">{name}{index === step ? " (actief)" : ""}</span></li>)}
      </ol>

      {step === 0 && <section className="studio-enter"><span className="studio-chip">JOUW NIEUWE PRODUCT</span><h3 className="mt-4 font-display text-2xl font-semibold">Hoe heet dit project?</h3><p className="mt-1 text-sm text-[var(--muted)]">Je kunt de titel later altijd wijzigen.</p><label className="label mt-6" htmlFor="project-title">{t("projectTitleLabel")}</label><input id="project-title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Bijv. Hotel Chic Bedroom Collection 2026" /></section>}

      {step === 1 && <section className="studio-enter"><h3 className="font-display text-2xl font-semibold">Wat ga je maken?</h3><p className="mt-1 text-sm text-[var(--muted)]">Dit bepaalt welke templates en velden beschikbaar zijn.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{PRODUCT_TYPES.map((type) => <button key={type} className={`min-h-28 rounded-2xl border p-4 text-left transition-all ${productType === type ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm" : "border-[var(--border)] hover:border-[var(--primary)]"}`} aria-pressed={productType === type} onClick={() => setProductType(type)}><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm"><Icon name={TYPE_INFO[type].icon} size={19} /></span><strong className="block text-base text-[var(--ink)]">{t(TYPE_INFO[type].label)}</strong><span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">{t(TYPE_INFO[type].blurb)}</span></button>)}</div></section>}

      {step === 2 && <section className="studio-enter"><h3 className="font-display text-2xl font-semibold">Talen en visuele richting</h3><div className="mt-5"><span className="label">{t("languageVersions")}</span><div className="flex flex-wrap gap-2">{(["en", "nl"] as Language[]).map((language) => <button key={language} className={`btn-secondary ${languages.includes(language) ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]" : ""}`} aria-pressed={languages.includes(language)} onClick={() => toggleLanguage(language)}>{language === "en" ? "English" : "Nederlands"}</button>)}</div><p className="mt-2 text-sm text-[var(--muted)]">{t("langVersionHint")}</p></div><div className="mt-7"><span className="label">{t("theme")}</span><div className="grid gap-3 sm:grid-cols-2">{THEMES.map((item) => <button key={item.id} className={`rounded-2xl border p-4 text-left ${theme === item.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:border-[var(--primary)]"}`} aria-pressed={theme === item.id} onClick={() => setTheme(item.id)}><span className="mb-3 flex gap-1.5">{item.defaultPalette.slice(0, 5).map((color, index) => <span key={index} className="h-6 flex-1 rounded-lg border border-black/10" style={{ backgroundColor: color.hex }} />)}</span><strong className="text-sm">{item.name}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.description}</span></button>)}</div></div></section>}

      {step === 3 && <section className="studio-enter"><span className="studio-chip">KLAAR OM TE STARTEN</span><h3 className="mt-4 font-display text-2xl font-semibold">Controleer je project</h3><dl className="mt-6 grid gap-3 rounded-2xl bg-[var(--surface-soft)] p-5 sm:grid-cols-2"><Summary label={t("projectTitleLabel")} value={title.trim() || "Untitled Project"} /><Summary label={t("productType")} value={t(TYPE_INFO[productType].label)} /><Summary label={t("languageVersions")} value={languages.map((language) => language.toUpperCase()).join(" + ")} /><Summary label={t("theme")} value={THEMES.find((item) => item.id === theme)?.name ?? theme} /></dl><p className="mt-5 text-sm text-[var(--muted)]">{t("wizardFootnote")}</p></section>}
    </Dialog>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</dt><dd className="mt-1 text-base font-semibold text-[var(--ink)]">{value}</dd></div>;
}
