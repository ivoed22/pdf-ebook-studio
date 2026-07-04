import { useStudio } from "../store/useStudio";
import { allTemplates, getTemplate, templatesForProductType } from "../core/templates/registry";
import { suggestMatch } from "../core/assets/imageStore";
import type { FieldValue, PaletteColor } from "../types/project";
import { LANGUAGES } from "../types/project";

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

export default function PageEditor() {
  const project = useStudio((s) => s.project);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const images = useStudio((s) => s.images);
  const setPageField = useStudio((s) => s.setPageField);
  const removePageField = useStudio((s) => s.removePageField);
  const setPageTemplate = useStudio((s) => s.setPageTemplate);
  const setPageNumber = useStudio((s) => s.setPageNumber);
  const setPageLanguage = useStudio((s) => s.setPageLanguage);

  const page = project?.pages.find((p) => p.id === selectedPageId);
  if (!project || !page) {
    return <p className="p-4 text-sm text-stone-400">Select a page to edit its content.</p>;
  }

  const template = getTemplate(page.template);
  const productTemplates = templatesForProductType(project.projectMeta.productType);
  const templateChoices = productTemplates.length ? productTemplates : allTemplates();
  const required = template?.requiredFields ?? [];
  const optional = template?.optionalFields ?? [];
  const known = new Set([...required, ...optional]);
  const extraFields = Object.keys(page.fields).filter((f) => !known.has(f));
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
                title="Pick an uploaded image"
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
              Not uploaded.{" "}
              {suggestion && (
                <button
                  className="underline cursor-pointer"
                  onClick={() => setPageField(page!.id, field, suggestion)}
                >
                  Use "{suggestion}"?
                </button>
              )}
            </p>
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
            <span className="normal-case font-normal text-stone-400"> — one per line</span>
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
          <label className="label">Page #</label>
          <input
            className="input"
            type="number"
            min={1}
            value={page.pageNumber}
            onChange={(e) => setPageNumber(page.id, Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Language</label>
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

      <label className="label">Template</label>
      <select
        className="input mb-1 cursor-pointer"
        value={page.template}
        onChange={(e) => setPageTemplate(page.id, e.target.value)}
      >
        {!templateChoices.some((t) => t.id === page.template) && (
          <option value={page.template}>{page.template || "(none)"}</option>
        )}
        {templateChoices.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {t.group}
          </option>
        ))}
      </select>
      {template && <p className="text-[11px] text-stone-400 mb-4 leading-snug">{template.layoutIntent}</p>}

      {required.length > 0 && (
        <>
          <div className="panel-title mb-2">Required fields</div>
          {required.map((f) => fieldEditor(f, true))}
        </>
      )}
      {optional.length > 0 && (
        <>
          <div className="panel-title mb-2 mt-5">Optional fields</div>
          {optional.map((f) => fieldEditor(f, false))}
        </>
      )}
      {extraFields.length > 0 && (
        <>
          <div className="panel-title mb-2 mt-5">Other fields on this page</div>
          {extraFields.map((f) => (
            <div key={f} className="relative">
              {fieldEditor(f, false)}
              <button
                className="absolute right-0 top-0 text-[10px] text-stone-400 hover:text-red-600"
                onClick={() => removePageField(page.id, f)}
              >
                remove
              </button>
            </div>
          ))}
        </>
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
          + Add color
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
            <option value="">Apply saved palette…</option>
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
