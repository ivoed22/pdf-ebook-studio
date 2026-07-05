import { useState } from "react";
import { useStudio } from "../store/useStudio";
import { getTemplate, rendererFor } from "../core/templates/registry";
import { suggestMatch } from "../core/assets/imageStore";
import type { FieldValue, PaletteColor } from "../types/project";
import { LANGUAGES } from "../types/project";
import { useT } from "../i18n/strings";
import TemplatePicker from "./TemplatePicker";
import type { ImageFocus } from "../pdf/components";

/** Fields edited as one-item-per-line lists. */
const LIST_FIELDS = new Set([
  "ingredients",
  "steps",
  "designNotes",
  "plantingNotes",
  "maintenanceNotes",
  "checklistItems",
  "keyTakeaways",
  "styleTags",
  "items",
  "columns",
  "rows",
  "nutrition",
  "materials",
  "images",
  "imageNotes",
]);

/** Fields edited as multi-line paragraphs. */
const LONG_FIELDS = new Set([
  "body",
  "whyItWorks",
  "howToRecreate",
  "designConcept",
  "notes",
  "intro",
  "text",
  "quote",
]);

const IMAGE_FIELDS = new Set(["heroImage", "imageA", "imageB"]);

const FOCUS_OPTIONS: { value: ImageFocus; labelKey: "focusTop" | "focusLeft" | "focusCenter" | "focusRight" | "focusBottom" }[] = [
  { value: "top", labelKey: "focusTop" },
  { value: "left", labelKey: "focusLeft" },
  { value: "center", labelKey: "focusCenter" },
  { value: "right", labelKey: "focusRight" },
  { value: "bottom", labelKey: "focusBottom" },
];

export default function PageEditor() {
  const project = useStudio((s) => s.project);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const images = useStudio((s) => s.images);
  const setPageField = useStudio((s) => s.setPageField);
  const removePageField = useStudio((s) => s.removePageField);
  const setPageTemplate = useStudio((s) => s.setPageTemplate);
  const setPageNumber = useStudio((s) => s.setPageNumber);
  const setPageLanguage = useStudio((s) => s.setPageLanguage);
  const t = useT();
  const [pickerOpen, setPickerOpen] = useState(false);

  const page = project?.pages.find((p) => p.id === selectedPageId);
  if (!project || !page) {
    return <p className="p-4 text-sm text-stone-400">{t("selectPagePrompt")}</p>;
  }

  const template = getTemplate(page.template);
  const required = template?.requiredFields ?? [];
  const optional = template?.optionalFields ?? [];
  const known = new Set([...required, ...optional]);
  const extraFields = Object.keys(page.fields).filter(
    (f) => !known.has(f) && !f.endsWith("Focus"),
  );
  const availableImages = [...images.keys()].sort();

  function fieldEditor(field: string, isRequired: boolean) {
    const value = page!.fields[field];

    if (field === "palette") {
      return <PaletteFieldEditor key={field} pageId={page!.id} value={value} />;
    }

    if (IMAGE_FIELDS.has(field)) {
      const current = typeof value === "string" ? value : "";
      const missing = current && !images.has(current);
      const suggestion = missing ? suggestMatch(current, availableImages) : undefined;
      const focus = (page!.fields[`${field}Focus`] as ImageFocus) || "center";
      return (
        <div key={field} className="mb-3">
          <label className="label">
            {labelFor(field)} {isRequired && <span className="text-amber-700">*</span>}
          </label>
          <div className="flex gap-1.5">
            <input
              className={`input ${missing ? "border-red-400" : ""}`}
              value={current}
              placeholder="page-01-cover.jpg"
              list="uploaded-images"
              onChange={(e) => setPageField(page!.id, field, e.target.value)}
            />
            {availableImages.length > 0 && (
              <select
                className="input w-9 px-1 shrink-0 cursor-pointer"
                value=""
                title={t("pickUploaded")}
                onChange={(e) => e.target.value && setPageField(page!.id, field, e.target.value)}
              >
                <option value="">…</option>
                {availableImages.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}
          </div>
          {missing && (
            <p className="text-[11px] text-red-600 mt-1">
              {t("notUploaded")}{" "}
              {suggestion && (
                <button
                  className="underline cursor-pointer"
                  onClick={() => setPageField(page!.id, field, suggestion)}
                >
                  {t("useSuggestion", { name: suggestion })}
                </button>
              )}
            </p>
          )}
          {current && !missing && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 mr-1">
                {t("focusPoint")}
              </span>
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  title={t(opt.labelKey)}
                  className={`h-5 w-5 rounded border text-[9px] font-bold cursor-pointer transition-colors ${
                    focus === opt.value
                      ? "border-amber-700 bg-amber-100 text-amber-800"
                      : "border-stone-200 text-stone-400 hover:border-stone-400"
                  }`}
                  onClick={() =>
                    opt.value === "center"
                      ? removePageField(page!.id, `${field}Focus`)
                      : setPageField(page!.id, `${field}Focus`, opt.value)
                  }
                >
                  {t(opt.labelKey).slice(0, 1)}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (LIST_FIELDS.has(field)) {
      const list = Array.isArray(value) ? (value as string[]).map(String) : value ? [String(value)] : [];
      return (
        <div key={field} className="mb-3">
          <label className="label">
            {labelFor(field)} {isRequired && <span className="text-amber-700">*</span>}
            <span className="normal-case font-normal text-stone-400">{t("onePerLine")}</span>
          </label>
          <textarea
            className="input font-mono text-xs"
            rows={Math.min(Math.max(list.length + 1, 3), 10)}
            value={list.join("\n")}
            onChange={(e) =>
              setPageField(
                page!.id,
                field,
                e.target.value.split("\n").filter((l, i, arr) => l.trim() !== "" || i === arr.length - 1),
              )
            }
          />
        </div>
      );
    }

    const str = typeof value === "string" ? value : Array.isArray(value) ? value.join("\n") : "";
    if (LONG_FIELDS.has(field)) {
      return (
        <div key={field} className="mb-3">
          <label className="label">
            {labelFor(field)} {isRequired && <span className="text-amber-700">*</span>}
          </label>
          <textarea
            className="input"
            rows={4}
            value={str}
            onChange={(e) => setPageField(page!.id, field, e.target.value)}
          />
        </div>
      );
    }
    return (
      <div key={field} className="mb-3">
        <label className="label">
          {labelFor(field)} {isRequired && <span className="text-amber-700">*</span>}
        </label>
        <input
          className="input"
          value={str}
          onChange={(e) => setPageField(page!.id, field, e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <datalist id="uploaded-images">
        {availableImages.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <label className="label">{t("pageNumber")}</label>
          <input
            className="input"
            type="number"
            min={1}
            value={page.pageNumber}
            onChange={(e) => setPageNumber(page.id, Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label className="label">{t("language")}</label>
          <select
            className="input cursor-pointer"
            value={page.language}
            onChange={(e) => setPageLanguage(page.id, e.target.value as (typeof LANGUAGES)[number])}
          >
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
          </select>
        </div>
      </div>

      <label className="label">{t("template")}</label>
      <button
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-left hover:border-stone-500 transition-colors cursor-pointer mb-1"
        onClick={() => setPickerOpen(true)}
      >
        <span className="text-sm font-medium text-stone-800">
          {template?.name ?? page.template ?? "—"}
        </span>
        <span className="float-right text-xs text-amber-700 font-semibold">{t("chooseTemplate")}</span>
        <span className="block text-[10px] text-stone-400 mt-0.5">
          {template?.group ?? ""} · {rendererFor(page.template)}
        </span>
      </button>
      {template && <p className="text-[11px] text-stone-400 mb-4 leading-snug">{template.layoutIntent}</p>}

      {required.length > 0 && (
        <>
          <div className="panel-title mb-2">{t("requiredFields")}</div>
          {required.map((f) => fieldEditor(f, true))}
        </>
      )}
      {optional.length > 0 && (
        <>
          <div className="panel-title mb-2 mt-5">{t("optionalFields")}</div>
          {optional.map((f) => fieldEditor(f, false))}
        </>
      )}
      {extraFields.length > 0 && (
        <>
          <div className="panel-title mb-2 mt-5">{t("otherFields")}</div>
          {extraFields.map((f) => (
            <div key={f} className="relative">
              {fieldEditor(f, false)}
              <button
                className="absolute right-0 top-0 text-[10px] text-stone-400 hover:text-red-600"
                onClick={() => removePageField(page.id, f)}
              >
                {t("remove")}
              </button>
            </div>
          ))}
        </>
      )}

      {pickerOpen && (
        <TemplatePicker
          productType={project.projectMeta.productType}
          current={page.template}
          onPick={(id) => setPageTemplate(page.id, id)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function labelFor(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function PaletteFieldEditor({ pageId, value }: { pageId: string; value: FieldValue | undefined }) {
  const setPageField = useStudio((s) => s.setPageField);
  const project = useStudio((s) => s.project);
  const t = useT();
  const colors: PaletteColor[] =
    Array.isArray(value) && value.length && typeof value[0] === "object"
      ? (value as PaletteColor[])
      : [];

  function update(next: PaletteColor[]) {
    setPageField(pageId, "palette", next);
  }

  return (
    <div className="mb-3">
      <label className="label">
        Palette <span className="text-amber-700">*</span>
      </label>
      {colors.map((color, i) => (
        <div key={i} className="flex gap-1.5 mb-1.5 items-center">
          <input
            type="color"
            className="h-8 w-9 rounded border border-stone-300 cursor-pointer bg-white"
            value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : "#cccccc"}
            onChange={(e) => update(colors.map((c, j) => (j === i ? { ...c, hex: e.target.value.toUpperCase() } : c)))}
          />
          <input
            className="input"
            placeholder="Name"
            value={color.name}
            onChange={(e) => update(colors.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)))}
          />
          <input
            className={`input w-24 shrink-0 font-mono text-xs ${
              /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.hex) ? "" : "border-red-400"
            }`}
            placeholder="#HEX"
            value={color.hex}
            onChange={(e) => update(colors.map((c, j) => (j === i ? { ...c, hex: e.target.value } : c)))}
          />
          <button
            className="text-stone-400 hover:text-red-600 text-xs px-1 cursor-pointer"
            onClick={() => update(colors.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-1">
        <button
          className="btn-ghost text-xs px-2 py-1"
          onClick={() => update([...colors, { name: `Color ${colors.length + 1}`, hex: "#CCCCCC" }])}
        >
          {t("addColor")}
        </button>
        {project && project.palettes.length > 0 && (
          <select
            className="input text-xs w-auto cursor-pointer"
            value=""
            onChange={(e) => {
              const palette = project.palettes.find((p) => p.id === e.target.value);
              if (palette) update(palette.colors.map((c) => ({ ...c })));
            }}
          >
            <option value="">{t("applySavedPalette")}</option>
            {project.palettes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
