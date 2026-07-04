import type { Theme } from "../types/theme";
import { templatePack } from "../core/templates/registry";

/** A4 portrait in PDF points. */
export const A4 = { width: 595.28, height: 841.89 };

export const MM_TO_PT = 72 / 25.4;

/** Safe margin from the template pack's global rules (14mm by default). */
export const SAFE_MARGIN = (templatePack.globalRules?.safeMarginMm ?? 14) * MM_TO_PT;

export interface PdfTokens {
  theme: Theme;
  margin: number;
  page: { width: number; height: number };
  font: { display: string; body: string };
  size: {
    coverTitle: number;
    title: number;
    subtitle: number;
    sectionHeading: number;
    body: number;
    small: number;
    footer: number;
  };
  leading: {
    body: number;
    tight: number;
  };
}

export function tokensFor(theme: Theme): PdfTokens {
  return {
    theme,
    margin: SAFE_MARGIN,
    page: A4,
    font: { display: theme.fonts.display, body: theme.fonts.body },
    size: {
      coverTitle: 40,
      title: 26,
      subtitle: 12.5,
      sectionHeading: 10,
      body: 10,
      small: 8.5,
      footer: 8,
    },
    leading: {
      body: 1.55,
      tight: 1.25,
    },
  };
}

/**
 * Minimal-shrink overflow policy from the template pack: estimate how much
 * text a template must fit and step the body size down slightly when a page
 * carries much more than a comfortable amount.
 */
export function bodySizeForAmount(base: number, totalChars: number, comfortable: number): number {
  if (totalChars <= comfortable) return base;
  if (totalChars <= comfortable * 1.25) return base - 0.5;
  if (totalChars <= comfortable * 1.5) return base - 1;
  return base - 1.5;
}
