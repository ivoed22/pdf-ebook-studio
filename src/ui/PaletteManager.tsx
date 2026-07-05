import { useRef } from "react";
import { useStudio } from "../store/useStudio";
import { PALETTE_PRESETS } from "../data/themes/themes";
import { newId, type Palette } from "../types/project";
import { isValidHex } from "../pdf/components";
import { useT } from "../i18n/strings";
import { toast } from "./kit/Toaster";

export default function PaletteManager() {
  const project = useStudio((s) => s.project);
  const setPalettes = useStudio((s) => s.setPalettes);
  const fileInput = useRef<HTMLInputElement>(null);
  const t = useT();

  if (!project) return null;
  const palettes = project.palettes;

  function save(next: Palette[]) {
    setPalettes(next);
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
      <p className="text-[11px] text-stone-400 mb-3 leading-snug">
        {t("paletteIntro")}{" "}
        <code className="font-mono">{`{"name":"My palette","colors":[{"name":"Cream","hex":"#F2E8D8"}]}`}</code>
      </p>
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
              className="input font-semibold"
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
          {palette.colors.map((color, ci) => (
            <div key={ci} className="flex gap-1.5 mb-1.5 items-center">
              <input
                type="color"
                className="h-8 w-9 rounded border border-stone-300 cursor-pointer bg-white"
                value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : "#cccccc"}
                onChange={(e) =>
                  save(
                    palettes.map((p, j) =>
                      j === pi
                        ? {
                            ...p,
                            colors: p.colors.map((c, k) =>
                              k === ci ? { ...c, hex: e.target.value.toUpperCase() } : c,
                            ),
                          }
                        : p,
                    ),
                  )
                }
              />
              <input
                className="input"
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
                className={`input w-24 shrink-0 font-mono text-xs ${isValidHex(color.hex) ? "" : "border-red-400"}`}
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
                className="text-stone-400 hover:text-red-600 text-xs px-1 cursor-pointer"
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
          {palette.colors.length < 3 && (
            <p className="text-[11px] text-amber-600 mt-1">{t("paletteTip")}</p>
          )}
        </div>
      ))}
    </div>
  );
}
