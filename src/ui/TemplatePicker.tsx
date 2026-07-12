import { useMemo, useState } from "react";
import { allTemplates, rendererFor, templatesForProductType } from "../core/templates/registry";
import type { RendererKind } from "../types/template";
import type { ProductType } from "../types/project";
import { useT } from "../i18n/strings";
import { Dialog } from "./kit/Dialog";

export default function TemplatePicker({
  productType,
  current,
  onPick,
  onClose,
}: {
  productType: ProductType;
  current: string;
  onPick: (templateId: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [group, setGroup] = useState<string>("");

  const templates = useMemo(() => {
    const forType = templatesForProductType(productType);
    return forType.length ? forType : allTemplates();
  }, [productType]);

  const groups = useMemo(() => [...new Set(templates.map((tp) => tp.group))], [templates]);
  const visible = group ? templates.filter((tp) => tp.group === group) : templates;

  return (
    <Dialog title={t("pickTemplateTitle")} description={`${visible.length} templates beschikbaar`} onClose={onClose} maxWidth="max-w-4xl">
        <div className="mb-4 flex items-center gap-3">
          <label className="label mb-0" htmlFor="template-group">Groep</label>
          <select
            id="template-group"
            className="input ml-auto w-auto cursor-pointer"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">{t("allGroups")}</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((tp) => (
              <button
                key={tp.id}
                className={`min-h-44 rounded-2xl border p-3 text-left transition-colors cursor-pointer ${
                  tp.id === current
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]/30"
                    : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
                onClick={() => {
                  onPick(tp.id);
                  onClose();
                }}
              >
                <Schematic kind={rendererFor(tp.id)} />
                <div className="mt-2 text-sm font-semibold text-[var(--ink)] leading-tight">
                  {tp.name}
                  {tp.id === current && (
                    <span className="ml-1 text-xs font-bold text-[var(--primary)] uppercase">
                      · {t("currentTemplate")}
                    </span>
                  )}
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--muted)]">
                  {tp.layoutIntent}
                </div>
              </button>
            ))}
          </div>
    </Dialog>
  );
}

/** Tiny CSS mock of each base renderer's layout — no PDF rendering needed. */
function Schematic({ kind }: { kind: RendererKind }) {
  return (
    <div className="aspect-[210/297] w-full rounded-sm border border-stone-200 bg-[#faf7f2] p-1.5 flex flex-col gap-1 overflow-hidden">
      {SCHEMATICS[kind]}
    </div>
  );
}

const img = (cls: string) => <div className={`rounded-[2px] bg-amber-200/80 ${cls}`} />;
const line = (w: string, dark = false) => (
  <div className={`h-[3px] rounded-full ${dark ? "bg-stone-500" : "bg-stone-300"} ${w}`} />
);
const lines = (n: number) => (
  <div className="flex flex-col gap-[3px]">
    {Array.from({ length: n }).map((_, i) => line(i === n - 1 ? "w-2/3" : "w-full"))}
  </div>
);
const palette = (
  <div className="flex gap-[2px]">
    {["bg-amber-100", "bg-amber-300", "bg-amber-600", "bg-stone-400", "bg-stone-600"].map((c, i) => (
      <div key={i} className={`h-[6px] flex-1 rounded-[1px] ${c}`} />
    ))}
  </div>
);

const SCHEMATICS: Record<RendererKind, React.ReactNode> = {
  "cover-editorial": (
    <>
      {img("h-[55%]")}
      <div className="flex-1 flex flex-col items-center justify-center gap-[3px]">
        {line("w-3/4", true)}
        {line("w-1/2")}
      </div>
    </>
  ),
  "cover-full-bleed": (
    <div className="relative flex-1 -m-1.5 bg-amber-200/80 flex items-end p-1.5">
      <div className="w-full flex flex-col gap-[3px]">
        {line("w-3/4", true)}
        {line("w-1/2")}
      </div>
    </div>
  ),
  "hero-top-content": (
    <>
      {img("h-[38%]")}
      {line("w-2/3", true)}
      <div className="flex gap-1.5 flex-1">
        <div className="flex-1">{lines(5)}</div>
        <div className="flex-1 flex flex-col gap-1">
          {palette}
          {lines(3)}
        </div>
      </div>
    </>
  ),
  "side-image-content": (
    <div className="flex gap-1.5 flex-1">
      <div className="flex-1 flex flex-col gap-1">
        {img("flex-1")}
        {palette}
      </div>
      <div className="flex-1 flex flex-col gap-[3px]">
        {line("w-3/4", true)}
        {lines(6)}
      </div>
    </div>
  ),
  "full-bleed-overlay": (
    <div className="relative flex-1 -m-1.5 bg-amber-200/80 flex items-end p-1.5">
      <div className="w-full flex flex-col gap-[3px] rounded-sm bg-stone-700/30 p-1">
        {line("w-2/3", true)}
        {line("w-full")}
      </div>
    </div>
  ),
  "moodboard-grid": (
    <>
      {line("w-1/2", true)}
      <div className="grid grid-cols-2 gap-1 flex-1">
        {img("")}
        {img("")}
        {img("")}
        {img("")}
      </div>
      {palette}
    </>
  ),
  "two-image-compare": (
    <>
      {line("w-1/2", true)}
      <div className="flex gap-1 h-[45%]">
        {img("flex-1")}
        {img("flex-1")}
      </div>
      {lines(3)}
    </>
  ),
  "text-editorial": (
    <>
      {line("w-2/3", true)}
      {line("w-1/3")}
      <div className="flex-1 mt-1">{lines(8)}</div>
    </>
  ),
  "two-column-text": (
    <>
      {line("w-2/3", true)}
      <div className="flex gap-1.5 flex-1 mt-1">
        <div className="flex-1">{lines(7)}</div>
        <div className="flex-1">{lines(7)}</div>
      </div>
    </>
  ),
  "checklist-page": (
    <>
      {line("w-2/3", true)}
      <div className="flex-1 flex flex-col gap-[5px] mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="h-[5px] w-[5px] border border-amber-600 rounded-[1px]" />
            {line("flex-1")}
          </div>
        ))}
      </div>
    </>
  ),
  "table-page": (
    <>
      {line("w-2/3", true)}
      <div className="h-[7px] rounded-[1px] bg-stone-300 mt-1" />
      <div className="flex-1 flex flex-col gap-[4px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-1">
            {line("flex-1")}
            {line("flex-1")}
            {line("flex-1")}
          </div>
        ))}
      </div>
    </>
  ),
  "section-divider": (
    <div className="flex-1 flex flex-col items-center justify-center gap-[4px]">
      <div className="h-[2px] w-4 bg-amber-600" />
      {line("w-2/3", true)}
      {line("w-1/2")}
    </div>
  ),
  "index-page": (
    <>
      {line("w-2/3", true)}
      <div className="flex-1 flex flex-col gap-[6px] mt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            {line("w-1/2")}
            <div className="flex-1 border-b border-dotted border-stone-300" />
            <div className="h-[3px] w-[6px] rounded-full bg-amber-600" />
          </div>
        ))}
      </div>
    </>
  ),
  "image-quote": (
    <>
      {img("h-[55%]")}
      <div className="flex-1 flex flex-col items-center justify-center gap-[3px]">
        {line("w-3/4")}
        {line("w-1/2")}
      </div>
    </>
  ),
  "workbook-page": (
    <>
      {line("w-2/3", true)}
      <div className="flex-1 flex flex-col gap-[7px] mt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-[4px]">
            {line("w-1/2", true)}
            <div className="border-b border-stone-300" />
            <div className="border-b border-stone-300" />
          </div>
        ))}
      </div>
    </>
  ),
  "recipe-hero": (
    <>
      {img("h-[32%]")}
      {line("w-2/3", true)}
      <div className="flex gap-[2px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[6px] flex-1 rounded-[1px] bg-stone-200" />
        ))}
      </div>
      <div className="flex gap-1.5 flex-1">
        <div className="flex-1">{lines(4)}</div>
        <div className="flex-[1.4]">{lines(5)}</div>
      </div>
    </>
  ),
  "recipe-split": (
    <div className="flex gap-1.5 flex-1">
      <div className="flex-1 flex flex-col gap-1">
        {img("h-[45%]")}
        {lines(4)}
      </div>
      <div className="flex-1 flex flex-col gap-[3px]">
        {line("w-3/4", true)}
        {lines(6)}
      </div>
    </div>
  ),
  "etsy-visual": (
    <div className="flex-1 border border-stone-300 rounded-sm p-1 flex flex-col items-center gap-[3px]">
      {line("w-1/2")}
      {line("w-3/4", true)}
      {img("h-[45%] w-full")}
      <div className="mt-auto w-full">{line("w-2/3")}</div>
    </div>
  ),
  "utility-text": (
    <>
      {line("w-2/3", true)}
      <div className="flex-1 mt-1">{lines(9)}</div>
    </>
  ),
};
