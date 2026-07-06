import type { Theme, ThemeColors } from "../../types/theme";
import type { Project } from "../../types/project";

export const THEMES: Theme[] = [
  {
    id: "hotel-chic-neutral",
    name: "Hotel Chic Neutral",
    description: "Warm layered neutrals with an understated luxury feeling.",
    fonts: { display: "Playfair Display", body: "Inter" },
    colors: {
      background: "#FAF7F2",
      surface: "#F1EAE0",
      text: "#3E3830",
      textMuted: "#8A8073",
      heading: "#2E2921",
      accent: "#A9824E",
      accentSoft: "#E4D6C0",
      divider: "#DDD2C2",
      footerText: "#A69B8A",
    },
    defaultPalette: [
      { name: "Cream", hex: "#F2E8D8" },
      { name: "Sand", hex: "#D6C0A2" },
      { name: "Taupe", hex: "#9B8574" },
      { name: "Walnut", hex: "#5D3925" },
      { name: "Brass", hex: "#A9824E" },
    ],
  },
  {
    id: "mediterranean-clean",
    name: "Mediterranean Clean",
    description: "Fresh whites with olive, lemon and sea-blue accents.",
    fonts: { display: "Playfair Display", body: "Inter" },
    colors: {
      background: "#FDFCF8",
      surface: "#F3F1E8",
      text: "#37403A",
      textMuted: "#7E8A80",
      heading: "#26302A",
      accent: "#7A8B5C",
      accentSoft: "#E5E9D6",
      divider: "#E0E2D4",
      footerText: "#9AA69C",
    },
    defaultPalette: [
      { name: "White Linen", hex: "#FDFCF8" },
      { name: "Olive", hex: "#7A8B5C" },
      { name: "Lemon", hex: "#E8C547" },
      { name: "Terracotta", hex: "#C4703F" },
      { name: "Sea Blue", hex: "#4E7A8A" },
    ],
  },
  {
    id: "scandinavian-soft",
    name: "Scandinavian Soft",
    description: "Airy light greys and pale wood tones, quiet and modern.",
    fonts: { display: "Cormorant Garamond", body: "Inter" },
    colors: {
      background: "#FBFBFA",
      surface: "#F0EFEC",
      text: "#41403C",
      textMuted: "#8D8C86",
      heading: "#302F2B",
      accent: "#A9A08B",
      accentSoft: "#E9E6DE",
      divider: "#E2E1DC",
      footerText: "#A5A49E",
    },
    defaultPalette: [
      { name: "Snow", hex: "#FBFBFA" },
      { name: "Fog", hex: "#DCDAD3" },
      { name: "Pale Oak", hex: "#D9C9B2" },
      { name: "Stone", hex: "#A9A08B" },
      { name: "Charcoal", hex: "#41403C" },
    ],
  },
  {
    id: "dark-editorial",
    name: "Dark Editorial",
    description: "Moody near-black pages with warm gold accents.",
    fonts: { display: "Playfair Display", body: "Inter" },
    colors: {
      background: "#1E1C1A",
      surface: "#2A2724",
      text: "#D8D2C8",
      textMuted: "#8F887C",
      heading: "#F0E9DC",
      accent: "#C0A264",
      accentSoft: "#3B3529",
      divider: "#3D3934",
      footerText: "#7C766B",
    },
    defaultPalette: [
      { name: "Ink", hex: "#1E1C1A" },
      { name: "Espresso", hex: "#3B3128" },
      { name: "Gold", hex: "#C0A264" },
      { name: "Bone", hex: "#E8E0D0" },
      { name: "Rust", hex: "#96502F" },
    ],
  },
  {
    id: "botanical-garden",
    name: "Botanical Garden",
    description: "Deep greens and earthy naturals for outdoor concepts.",
    fonts: { display: "Cormorant Garamond", body: "Inter" },
    colors: {
      background: "#F8F8F3",
      surface: "#ECEEE3",
      text: "#39443A",
      textMuted: "#7D897E",
      heading: "#273327",
      accent: "#4E6B4F",
      accentSoft: "#DCE4D6",
      divider: "#DCE0D2",
      footerText: "#93A093",
    },
    defaultPalette: [
      { name: "Ivory", hex: "#F8F8F3" },
      { name: "Sage", hex: "#A9B79B" },
      { name: "Forest", hex: "#4E6B4F" },
      { name: "Bark", hex: "#6E5A44" },
      { name: "Slate", hex: "#5C6670" },
    ],
  },
  {
    id: "warm-minimal",
    name: "Warm Minimal",
    description: "Clean editorial white with soft clay and blush accents.",
    fonts: { display: "Playfair Display", body: "Inter" },
    colors: {
      background: "#FFFFFF",
      surface: "#F6F1EC",
      text: "#44403B",
      textMuted: "#93897F",
      heading: "#332F2A",
      accent: "#B37D5E",
      accentSoft: "#EFDFD4",
      divider: "#E8E1D9",
      footerText: "#A99F94",
    },
    defaultPalette: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Blush", hex: "#EFDFD4" },
      { name: "Clay", hex: "#B37D5E" },
      { name: "Cocoa", hex: "#6B5040" },
      { name: "Graphite", hex: "#44403B" },
    ],
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** The core theme roles the user can edit directly; the rest are derived. */
export const EDITABLE_THEME_ROLES = [
  "background",
  "surface",
  "text",
  "heading",
  "accent",
  "divider",
] as const;
export type EditableThemeRole = (typeof EDITABLE_THEME_ROLES)[number];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Linear blend between two hex colors (t=0 → a, t=1 → b). */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

const isHex = (v: string | undefined): v is string => !!v && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

/**
 * The effective theme for a project: the chosen base theme with the user's
 * per-role color overrides applied, and the subtle roles (muted text, soft
 * accent, footer) re-derived so they always harmonize with the new colors.
 */
export function resolveProjectTheme(project: Project): Theme {
  const base = getTheme(project.projectMeta.theme);
  const overrides = project.projectMeta.themeColors;
  if (!overrides || Object.keys(overrides).length === 0) return base;

  const core: ThemeColors = { ...base.colors };
  for (const role of EDITABLE_THEME_ROLES) {
    if (isHex(overrides[role])) core[role] = overrides[role];
  }
  const colors: ThemeColors = {
    ...core,
    textMuted: isHex(overrides.textMuted) ? overrides.textMuted : mixHex(core.text, core.background, 0.45),
    accentSoft: isHex(overrides.accentSoft) ? overrides.accentSoft : mixHex(core.accent, core.background, 0.72),
    footerText: isHex(overrides.footerText) ? overrides.footerText : mixHex(core.text, core.background, 0.55),
  };
  return { ...base, colors };
}

/** Standalone palette presets available in the palette manager. */
export const PALETTE_PRESETS: { id: string; name: string; colors: { name: string; hex: string }[] }[] =
  THEMES.map((t) => ({ id: `preset-${t.id}`, name: t.name, colors: t.defaultPalette }));
