export interface ThemeFonts {
  /** Registered react-pdf font family for display headings. */
  display: string;
  /** Registered react-pdf font family for body text. */
  body: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  heading: string;
  accent: string;
  accentSoft: string;
  divider: string;
  footerText: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  fonts: ThemeFonts;
  colors: ThemeColors;
  /** Default palette shown in the palette manager when a page has none. */
  defaultPalette: { name: string; hex: string }[];
}
