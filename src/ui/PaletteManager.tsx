import { useRef } from "react";
import { useStudio } from "../store/useStudio";
import { PALETTE_PRESETS } from "../data/themes/themes";
import { getTemplate } from "../core/templates/registry";
import { newId, type Palette, type PaletteColor } from "../types/project";
import { isValidHex } from "../pdf/components";
import { useT } from "../i18n/strings";
import { toast } from "./kit/Toaster";
import { ColorField } from "./kit/ColorField";
import ThemeColorsEditor from "./ThemeColorsEditor";

export default function PaletteManager() {
  const project = useStudio((s) => s.project);
  const setPalettes = useStudio((s) => s.setPalettes);
  const setPageField = useStudio((s) => s.setPageField);
  const selectedPageId = useStudio((s) => s.selectedPageId);
  const fileInput = useRef<HTMLInputElement>(null);
  const t = useT();

  if (!project) return null;
  const palettes = project.palettes;
  const selectedPage = project.pages.find((p) => p.id === selectedPageId);

  function save(next: Palette[]) {
    setPalettes(next);
  }

  function applyToPage(colors: PaletteColor[]) {
    if (!selectedPage) {
      toast.info(t("paletteNoPage"));
      return;
    }
    const def = getTemplate(selectedPage.template);
    const hasPaletteArea =
      def && [...def.requiredFields, ...def.optionalFields].includes("palette");
    setPageField(selectedPage.id, "palette", colors.map((c) => ({ ...c })));
    if (hasPaletteArea) {
      toast.success(t("paletteApplied", { n: selectedPage.pageNumber }));
    } else {
      toast.info(t("paletteNoArea", { n: selectedPage.pageNumber }));
    }
  }

  async function importPaletteFile(file: File) {
    try {
      const data = JSON.parse(await file.text());
      const list: Palette[] = Array.isArray(data) ? data : [data];
      const cleaned = list
        .filter((p) => p && Array.isArray(p.colors))
        .map((p) => ({
          id: newId(),
          name: String(p.name ?? "Imported palette"),
          colors: p.colors.map((c: { name?: string; hex?: string }) => ({
            name: String(c.name ?? c.hex ?? "Color"),
            hex: String(c.hex ?? "").toUpperCase(),
          })),
        }));
      if (!cleaned.length) throw new Error("No palettes found in file.");
      save([...palettes, ...cleaned]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("paletteReadError"));
    }
  }

  return (
    <div className="p-4">
      <ThemeColorsEditor />

      <div className="flex items-baseline justify-between mb-1">
        <span className="panel-title">{t("paletteLibraryHeading")}</span>
      </div>
      <p className="text-[11px] text-stone-400 leading-snug mb-3">{t("paletteLibrarySub")}</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          className="btn-secondary text-xs"
          onClick={() =>
            save([
              ...palettes,
              { id: newId(), name: `Palette ${palettes.length + 1}`, colors: [{ name: "Color 1", hex: "#CCCCCC" }] },
            ])
          }
        >
          {t("newPalette")}
        </button>
        <button className="btn-secondary text-xs" onClick={() => fileInput.current?.click()}>
          {t("importJsonShort")}
        </button>
        <select
          className="input text-xs w-auto cursor-pointer"
          value=""
          onChange={(e) => {
            const preset = PALETTE_PRESETS.find((p) => p.id === e.target.value);
            if (preset) {
              save([...palettes, { id: newId(), name: preset.name, colors: preset.colors.map((c) => ({ ...c })) }]);
            }
          }}
        >
          <option value="">{t("addPreset")}</option>
          {PALETTE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          ref={fileInput}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importPaletteFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {palettes.length === 0 && <p className="text-xs text-stone-400">{t("noPalettes")}</p>}

      {palettes.map((palette, pi) => (
        <div key={palette.id} className="rounded-md border border-stone-200 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              className="input font-semibold min-w-0 flex-1"
              value={palette.name}
              onChange={(e) =>
                save(palettes.map((p, j) => (j === pi ? { ...p, name: e.target.value } : p)))
              }
            />
            <button
              className="text-xs text-stone-400 hover:text-red-600 shrink-0 cursor-pointer"
              onClick={() => save(palettes.filter((_, j) => j !== pi))}
            >
              {t("delete")}
            </button>
          </div>

          {/* preview swatches */}
          <div className="flex gap-1 mb-2">
            {palette.colors.map((c, k) => (
              <span
                key={k}
                className="h-5 flex-1 rounded-sm border border-black/5"
                style={{ backgroundColor: isValidHex(c.hex) ? c.hex : "#f5f5f4" }}
                title={`${c.name} ${c.hex}`}
              />
            ))}
          </div>

          {palette.colors.map((color, ci) => (
            <div key={ci} className="flex gap-1.5 mb-1.5 items-center">
              <ColorField
                hex={color.hex}
                onChange={(hex) =>
                  save(
                    palettes.map((p, j) =>
                      j === pi
                        ? { ...p, colors: p.colors.map((c, k) => (k === ci ? { ...c, hex } : c)) }
                        : p,
                    ),
                  )
                }
              />
              <input
                className="input flex-1 min-w-0"
                placeholder={t("colorName")}
                value={color.name}
                onChange={(e) =>
                  save(
                    palettes.map((p, j) =>
                      j === pi
                        ? { ...p, colors: p.colors.map((c, k) => (k === ci ? { ...c, name: e.target.value } : c)) }
                        : p,
                    ),
                  )
                }
              />
              <input
                className={`input w-20 shrink-0 font-mono text-xs ${isValidHex(color.hex) ? "" : "border-red-400"}`}
                value={color.hex}
                onChange={(e) =>
                  save(
                    palettes.map((p, j) =>
                      j === pi
                        ? { ...p, colors: p.colors.map((c, k) => (k === ci ? { ...c, hex: e.target.value } : c)) }
                        : p,
                    ),
                  )
                }
              />
              <button
                className="text-stone-400 hover:text-red-600 text-xs px-1 cursor-pointer shrink-0"
                onClick={() =>
                  save(
                    palettes.map((p, j) =>
                      j === pi ? { ...p, colors: p.colors.filter((_, k) => k !== ci) } : p,
                    ),
                  )
                }
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 mt-2">
            <button
              className="btn-ghost text-xs px-2 py-1"
              onClick={() =>
                save(
                  palettes.map((p, j) =>
                    j === pi
                      ? { ...p, colors: [...p.colors, { name: `Color ${p.colors.length + 1}`, hex: "#CCCCCC" }] }
                      : p,
                  ),
                )
              }
            >
              {t("addColor")}
            </button>
            <button
              className="btn-secondary text-xs px-2 py-1"
              onClick={() => applyToPage(palette.colors)}
            >
              {t("applyToPage")}
            </button>
          </div>
          {palette.colors.length < 3 && (
            <p className="text-[11px] text-amber-600 mt-1">{t("paletteTip")}</p>
          )}
        </div>
      ))}
    </div>
  );
}
