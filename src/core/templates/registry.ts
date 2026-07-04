import packJson from "../../data/templates/starter-template-pack-expanded-v2.json";
import type { RendererKind, TemplateDef, TemplatePack } from "../../types/template";
import type { ProductType } from "../../types/project";

export const templatePack = packJson as unknown as TemplatePack;

const byId = new Map<string, TemplateDef>();
for (const t of templatePack.templates) byId.set(t.id, t);

export function getTemplate(id: string): TemplateDef | undefined {
  return byId.get(id);
}

export function allTemplates(): TemplateDef[] {
  return templatePack.templates;
}

export function templatesForProductType(productType: ProductType): TemplateDef[] {
  return templatePack.templates.filter((t) => (t.productTypes as string[]).includes(productType));
}

/**
 * Maps every template id in the pack to a shared base renderer.
 * Template ids and required fields stay intact so exact per-id renderers
 * can replace these mappings later without touching project data.
 */
export const RENDERER_MAP: Record<string, RendererKind> = {
  // Core Magazine
  "magazine-cover-editorial": "cover-editorial",
  "magazine-cover-full-bleed": "cover-full-bleed",
  "magazine-opening-page": "text-editorial",
  "magazine-introduction": "text-editorial",
  "magazine-principles": "checklist-page",
  "magazine-how-to-use": "text-editorial",
  "magazine-collection-overview": "index-page",
  "magazine-section-divider": "section-divider",
  // Interior Magazine
  "interior-concept-v1": "hero-top-content",
  "interior-concept-v2-side-image": "side-image-content",
  "interior-concept-v3-full-bleed": "full-bleed-overlay",
  "interior-concept-v4-detail-focus": "hero-top-content",
  "interior-moodboard-grid": "moodboard-grid",
  "interior-before-after-direction": "two-image-compare",
  "interior-shopping-direction": "checklist-page",
  "interior-style-checklist": "checklist-page",
  "interior-palette-deep-dive": "side-image-content",
  "interior-materials-library": "moodboard-grid",
  "interior-final-summary": "text-editorial",
  // Recipe Ebook
  "recipe-cover-luxury": "cover-editorial",
  "recipe-intro-editorial": "text-editorial",
  "recipe-index": "index-page",
  "recipe-category-divider": "section-divider",
  "recipe-full-hero": "recipe-hero",
  "recipe-split-detail": "recipe-split",
  "recipe-minimal-card": "recipe-split",
  "recipe-photo-story": "recipe-hero",
  "recipe-nutrition-page": "table-page",
  "recipe-shopping-list": "checklist-page",
  "recipe-meal-plan": "table-page",
  "recipe-tips-and-swaps": "checklist-page",
  "recipe-outro-checklist": "checklist-page",
  // Exterior Magazine
  "exterior-cover-editorial": "cover-editorial",
  "exterior-concept-v1": "hero-top-content",
  "exterior-facade-concept": "hero-top-content",
  "exterior-garden-concept": "hero-top-content",
  "exterior-patio-concept": "hero-top-content",
  "exterior-material-palette": "side-image-content",
  "exterior-lighting-plan": "side-image-content",
  "exterior-planting-scheme": "moodboard-grid",
  "exterior-maintenance-notes": "checklist-page",
  "exterior-summary": "text-editorial",
  // General Ebook
  "guide-cover": "cover-editorial",
  "chapter-divider": "section-divider",
  "guide-text-page": "text-editorial",
  "guide-two-column-text": "two-column-text",
  "guide-image-quote": "image-quote",
  "guide-checklist": "checklist-page",
  "guide-workbook-page": "workbook-page",
  "guide-comparison-table": "table-page",
  "guide-summary": "text-editorial",
  "guide-next-steps": "checklist-page",
  // Bonus / Utility
  "bonus-read-me": "utility-text",
  "bonus-license-disclaimer": "utility-text",
  "bonus-contact-sheet": "moodboard-grid",
  "bonus-qc-report": "utility-text",
  // Etsy Listing Visuals
  "etsy-main-cover-mockup": "etsy-visual",
  "etsy-whats-included": "etsy-visual",
  "etsy-inside-preview": "etsy-visual",
  "etsy-perfect-for": "etsy-visual",
  "etsy-style-grid": "etsy-visual",
  "etsy-palette-preview": "etsy-visual",
  "etsy-digital-download-disclaimer": "etsy-visual",
  "etsy-bonus-files": "etsy-visual",
  "etsy-how-it-works": "etsy-visual",
  "etsy-final-cta": "etsy-visual",
};

export function rendererFor(templateId: string): RendererKind {
  return RENDERER_MAP[templateId] ?? "text-editorial";
}

export function isKnownTemplate(templateId: string): boolean {
  return byId.has(templateId);
}
