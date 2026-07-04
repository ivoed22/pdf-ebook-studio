import type { ProductType } from "./project";

export interface TemplateDef {
  id: string;
  name: string;
  group: string;
  productTypes: ProductType[] | string[];
  pageRole: string;
  outputOnly: boolean;
  requiredFields: string[];
  optionalFields: string[];
  layoutIntent: string;
  imageArea: string;
  textAreas: string[];
  paletteArea?: string;
  recommendedUse?: string;
  visualNotes?: string;
  validationNotes?: string[];
}

export interface TemplatePack {
  templatePackName: string;
  version: string;
  documentFormat: string;
  globalRules: {
    safeMarginMm: number;
    footer: { enabled: boolean; leftTextField: string; rightText: string };
    header: { enabled: boolean };
    overflowPolicy: string;
    imageCropControls: string[];
    supportedProductTypes: string[];
    supportedLanguages: string[];
    supportedExportProfiles: string[];
  };
  templateGroups: string[];
  templates: TemplateDef[];
}

/** Base renderer identifiers — each template id maps to one of these. */
export type RendererKind =
  | "cover-editorial"
  | "cover-full-bleed"
  | "hero-top-content"
  | "side-image-content"
  | "full-bleed-overlay"
  | "moodboard-grid"
  | "two-image-compare"
  | "text-editorial"
  | "two-column-text"
  | "checklist-page"
  | "table-page"
  | "section-divider"
  | "index-page"
  | "image-quote"
  | "workbook-page"
  | "recipe-hero"
  | "recipe-split"
  | "etsy-visual"
  | "utility-text";
