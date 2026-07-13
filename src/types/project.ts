import { z } from "zod";

export const PRODUCT_TYPES = [
  "recipe-ebook",
  "interior-magazine",
  "exterior-magazine",
  "general-ebook",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const LANGUAGES = ["nl", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const OUTPUT_PROFILES = ["standard-pdf", "etsy-digital-product"] as const;
export type OutputProfile = (typeof OUTPUT_PROFILES)[number];

export const PaletteColorSchema = z.object({
  name: z.string(),
  hex: z.string(),
});
export type PaletteColor = z.infer<typeof PaletteColorSchema>;

export const PaletteSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.array(PaletteColorSchema),
});
export type Palette = z.infer<typeof PaletteSchema>;

/**
 * A page's content fields. Scalar fields (title, prepTime, ...) are strings;
 * list fields (ingredients, steps, designNotes, palette, ...) are arrays.
 */
export const FieldValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.array(PaletteColorSchema),
]);
export type FieldValue = z.infer<typeof FieldValueSchema>;

export const ProductionImageStatusSchema = z.enum(["planned", "uploaded", "approved", "rejected"]);
export type ProductionImageStatus = z.infer<typeof ProductionImageStatusSchema>;

export const ProductionImageRecordSchema = z.object({
  filename: z.string(),
  pageId: z.string().optional(),
  language: z.enum(LANGUAGES).optional(),
  field: z.string().optional(),
  templateId: z.string().optional(),
  purpose: z.string().optional(),
  orientation: z.enum(["landscape", "portrait", "square"]).optional(),
  aspectRatio: z.string().optional(),
  cropFocus: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  cropZoom: z.number().min(1).max(3).optional(),
  prompt: z.string(),
  avoid: z.string().optional(),
  batchId: z.string().optional(),
  status: ProductionImageStatusSchema.default("planned"),
  rejectionReason: z.string().optional(),
  updatedAt: z.string(),
});
export type ProductionImageRecord = z.infer<typeof ProductionImageRecordSchema>;

export const ProductionBatchSchema = z.object({
  id: z.string(),
  label: z.string(),
  filenames: z.array(z.string()),
  promptText: z.string().optional(),
});
export type ProductionBatch = z.infer<typeof ProductionBatchSchema>;

export const ProductionPlanSchema = z.object({
  qcStatus: z.enum(["needs-images", "pass"]).default("needs-images"),
  images: z.array(ProductionImageRecordSchema).default([]),
  batches: z.array(ProductionBatchSchema).default([]),
  sourceMarkdown: z.string().optional(),
});
export type ProductionPlan = z.infer<typeof ProductionPlanSchema>;

export const PageSchema = z.object({
  id: z.string(),
  pageNumber: z.number().int().positive(),
  template: z.string(),
  language: z.enum(LANGUAGES),
  fields: z.record(z.string(), FieldValueSchema),
  translationKey: z.string().optional(),
  contentRevision: z.number().int().nonnegative().optional(),
  chapter: z.string().optional(),
  translationSourceRevision: z.number().int().nonnegative().optional(),
});
export type Page = z.infer<typeof PageSchema>;

export const ProjectMetaSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  productType: z.enum(PRODUCT_TYPES),
  documentFormat: z.literal("A4-portrait"),
  theme: z.string(),
  /** Per-role overrides on top of the chosen base theme (hex per ThemeColors key). */
  themeColors: z.record(z.string(), z.string()).optional(),
  outputProfile: z.enum(OUTPUT_PROFILES).default("etsy-digital-product"),
  author: z.string().optional(),
  year: z.string().optional(),
  listing: z.record(z.string(), z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).max(13).optional(),
    contents: z.string().optional(),
    customerReadme: z.string().optional(),
    thumbnailOrder: z.array(z.string()).optional(),
  })).optional(),
});
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

export const ProjectAssetsSchema = z.object({
  imageFolder: z.string().optional(),
  coverImage: z.string().optional(),
});
export type ProjectAssets = z.infer<typeof ProjectAssetsSchema>;

export const ProjectOrganizationSchema = z.object({
  folder: z.string().optional(),
  tags: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
  archived: z.boolean().default(false),
});

export const ProjectSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]).default(2),
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  projectMeta: ProjectMetaSchema,
  languageVersions: z.array(z.enum(LANGUAGES)).min(1),
  assets: ProjectAssetsSchema,
  palettes: z.array(PaletteSchema).default([]),
  pages: z.array(PageSchema),
  production: ProductionPlanSchema.optional(),
  organization: ProjectOrganizationSchema.optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export function migrateProject(input: unknown): Project {
  const parsed = ProjectSchema.parse(input);
  return {
    ...parsed,
    schemaVersion: 2,
    production: parsed.production ?? { qcStatus: "needs-images", images: [], batches: [] },
    organization: parsed.organization ?? { tags: [], favorite: false, archived: false },
    pages: parsed.pages.map((page) => ({ ...page, contentRevision: page.contentRevision ?? 0 })),
  };
}

/** Image asset stored in IndexedDB and referenced by filename from page fields. */
export interface ImageAsset {
  filename: string;
  type: string;
  size: number;
  blob: Blob;
  width?: number;
  height?: number;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createEmptyProject(partial: {
  title: string;
  productType: ProductType;
  theme: string;
  languageVersions: Language[];
}): Project {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    projectMeta: {
      title: partial.title,
      productType: partial.productType,
      documentFormat: "A4-portrait",
      theme: partial.theme,
      outputProfile: "etsy-digital-product",
    },
    languageVersions: partial.languageVersions,
    assets: {},
    palettes: [],
    pages: [],
    production: { qcStatus: "needs-images", images: [], batches: [] },
    organization: { tags: [], favorite: false, archived: false },
  };
}

/** Fields that hold a single image filename. */
export const IMAGE_FIELDS = ["heroImage", "imageA", "imageB"] as const;
/** Fields that hold a list of image filenames. */
export const IMAGE_LIST_FIELDS = ["images"] as const;

export function imageFilenamesForPage(page: Page): string[] {
  const names: string[] = [];
  for (const f of IMAGE_FIELDS) {
    const v = page.fields[f];
    if (typeof v === "string" && v.trim()) names.push(v.trim());
  }
  for (const f of IMAGE_LIST_FIELDS) {
    const v = page.fields[f];
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim()) names.push(item.trim());
      }
    }
  }
  return names;
}
