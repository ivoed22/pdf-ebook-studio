import type { ImageAsset, Language, Page, Project } from "../../types/project";
import { IMAGE_FIELDS, IMAGE_LIST_FIELDS, imageFilenamesForPage } from "../../types/project";
import { RENDERER_MAP, getTemplate, isKnownTemplate } from "../templates/registry";
import { isValidHex } from "../../pdf/components";
import { suggestMatch } from "../assets/imageStore";

export type IssueSeverity = "error" | "warning";

/** Machine-applicable remedy attached to a fixable issue. */
export type IssueFix =
  | { kind: "renumber"; language: Language }
  | { kind: "set-page-field"; pageId: string; field: string; value: string }
  | { kind: "page-palette-hex"; pageId: string; index: number; hex: string }
  | { kind: "project-palette-hex"; paletteId: string; index: number; hex: string }
  | { kind: "remove-image"; filename: string };

export interface Issue {
  severity: IssueSeverity;
  code: string;
  message: string;
  pageId?: string;
  pageNumber?: number;
  language?: Language;
  fix?: IssueFix;
}

/** Returns a valid uppercase #HEX when the input is merely mis-formatted, else undefined. */
export function normalizeHex(hex: string): string | undefined {
  const cleaned = hex.trim().replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{3}$|^[0-9A-F]{6}$|^[0-9A-F]{8}$/.test(cleaned)) return `#${cleaned}`;
  return undefined;
}

/** Comfortable character budgets per renderer family for overflow warnings. */
const OVERFLOW_BUDGET: Record<string, number> = {
  "hero-top-content": 1900,
  "side-image-content": 1800,
  "recipe-hero": 2100,
  "recipe-split": 2000,
  "text-editorial": 3300,
  "two-column-text": 4200,
  "checklist-page": 2600,
  default: 3000,
};

/**
 * Equivalent field names: the template pack requires "intro" on some templates
 * while its own samples use "subtitle" (and renderers accept either).
 */
const FIELD_ALIASES: Record<string, string[]> = {
  intro: ["subtitle"],
  subtitle: ["intro"],
  body: ["text"],
  text: ["body"],
};

function pageTextLength(page: Page): number {
  let n = 0;
  for (const v of Object.values(page.fields)) {
    if (typeof v === "string") n += v.length;
    else if (Array.isArray(v)) for (const item of v) n += typeof item === "string" ? item.length : 14;
  }
  return n;
}

export function validateProject(project: Project, images: Map<string, ImageAsset>): Issue[] {
  const issues: Issue[] = [];
  const usedImages = new Set<string>();

  // --- per page ---
  for (const page of project.pages) {
    const loc = { pageId: page.id, pageNumber: page.pageNumber, language: page.language };
    const title = page.fields.title;
    if (typeof title === "string" && title.length > 110) issues.push({ severity: "warning", code: "long-title", message: `Title has ${title.length} characters; 110 or fewer is safer.`, ...loc });

    if (!page.template) {
      issues.push({ severity: "error", code: "missing-template", message: "No template assigned.", ...loc });
    } else if (!isKnownTemplate(page.template)) {
      issues.push({
        severity: "error",
        code: "unknown-template",
        message: `Template "${page.template}" is not in the template pack.`,
        ...loc,
      });
    } else {
      const def = getTemplate(page.template)!;
      const hasValue = (name: string) => {
        const v = page.fields[name];
        return !(
          v === undefined ||
          (typeof v === "string" && v.trim() === "") ||
          (Array.isArray(v) && v.length === 0)
        );
      };
      for (const field of def.requiredFields) {
        const satisfied = hasValue(field) || (FIELD_ALIASES[field] ?? []).some(hasValue);
        if (!satisfied) {
          issues.push({
            severity: "error",
            code: "missing-field",
            message: `Required field "${field}" is empty (template ${def.id}).`,
            ...loc,
          });
        }
      }
    }

    const available = [...images.keys()];
    for (const field of IMAGE_FIELDS) {
      const v = page.fields[field];
      if (typeof v !== "string" || !v.trim()) continue;
      const filename = v.trim();
      usedImages.add(filename);
      if (!images.has(filename)) {
        const suggestion = suggestMatch(filename, available);
        issues.push({
          severity: "error",
          code: "missing-image",
          message: `Image "${filename}" is referenced but not uploaded.${suggestion ? ` Closest upload: "${suggestion}".` : ""}`,
          ...loc,
          fix: suggestion
            ? { kind: "set-page-field", pageId: page.id, field, value: suggestion }
            : undefined,
        });
      }
    }
    for (const field of IMAGE_LIST_FIELDS) {
      const v = page.fields[field];
      if (!Array.isArray(v)) continue;
      for (const item of v) {
        if (typeof item !== "string" || !item.trim()) continue;
        const filename = item.trim();
        usedImages.add(filename);
        if (!images.has(filename)) {
          issues.push({
            severity: "error",
            code: "missing-image",
            message: `Image "${filename}" is referenced but not uploaded.`,
            ...loc,
          });
        }
      }
    }

    const palette = page.fields.palette;
    if (Array.isArray(palette) && palette.length && typeof palette[0] === "object") {
      const colors = palette as { name: string; hex: string }[];
      colors.forEach((color, index) => {
        if (!isValidHex(color.hex)) {
          const normalized = normalizeHex(color.hex ?? "");
          issues.push({
            severity: "error",
            code: "invalid-hex",
            message: `Palette color "${color.name}" has invalid HEX "${color.hex || "(empty)"}".`,
            ...loc,
            fix: normalized
              ? { kind: "page-palette-hex", pageId: page.id, index, hex: normalized }
              : undefined,
          });
        }
      });
      if (colors.length > 0 && colors.length < 3) {
        issues.push({
          severity: "warning",
          code: "incomplete-palette",
          message: `Palette has only ${colors.length} color${colors.length === 1 ? "" : "s"} — 3 to 6 renders best.`,
          ...loc,
        });
      }
    }

    const budget = OVERFLOW_BUDGET[RENDERER_MAP[page.template] ?? "default"] ?? OVERFLOW_BUDGET.default;
    const length = pageTextLength(page);
    if (length > budget) {
      issues.push({
        severity: "warning",
        code: "overflow-risk",
        message: `Page holds ~${length} characters (comfortable is ~${budget}); text may run tight. The renderer will shrink slightly — consider trimming.`,
        ...loc,
      });
    }
  }

  const usage = new Map<string, number>();
  for (const page of project.pages) for (const filename of imageFilenamesForPage(page)) usage.set(filename, (usage.get(filename) ?? 0) + 1);
  for (const [filename, count] of usage) if (count > 1) issues.push({ severity: "warning", code: "reused-image", message: `Image "${filename}" is used ${count} times; confirm this is intentional.` });

  if (project.production) {
    const records = new Map(project.production.images.map((item) => [item.filename, item]));
    for (const filename of usedImages) if (!records.has(filename)) issues.push({ severity: "warning", code: "missing-production-record", message: `Image "${filename}" has no production prompt record.` });
    for (const record of project.production.images) {
      if (record.status === "rejected") issues.push({ severity: "error", code: "rejected-image", message: `Image "${record.filename}" is rejected and must be replaced or approved.`, pageId: record.pageId, language: record.language });
      if (images.has(record.filename) && record.status === "planned") issues.push({ severity: "warning", code: "image-status-stale", message: `Image "${record.filename}" is uploaded but still marked as planned.` });
      if ((record.cropZoom ?? 1) > 2.2) issues.push({ severity: "warning", code: "extreme-crop", message: `Image "${record.filename}" uses ${record.cropZoom?.toFixed(1)}× crop zoom; verify the safe area and effective resolution.`, pageId: record.pageId, language: record.language });
      const asset = images.get(record.filename);
      if (asset?.width && asset.height && record.orientation) {
        const actual = asset.width / asset.height;
        const expectedOrientation = actual > 1.08 ? "landscape" : actual < 0.92 ? "portrait" : "square";
        if (expectedOrientation !== record.orientation) issues.push({ severity: "warning", code: "image-aspect-mismatch", message: `Image "${record.filename}" is ${expectedOrientation}, but the production plan requests ${record.orientation}.`, pageId: record.pageId, language: record.language });
        const effectiveDpi = Math.round(asset.width / (record.orientation === "portrait" ? 4.2 : record.orientation === "square" ? 5.5 : 7.2));
        if (effectiveDpi < 200) issues.push({ severity: "warning", code: "low-image-dpi", message: `Image "${record.filename}" is approximately ${effectiveDpi} effective DPI; 200 minimum and 300 recommended.`, pageId: record.pageId, language: record.language });
      }
    }
  }

  const links = new Map<string, Page[]>();
  for (const page of project.pages) if (page.translationKey) links.set(page.translationKey, [...(links.get(page.translationKey) ?? []), page]);
  for (const [key, pages] of links) {
    const languages = new Set(pages.map((page) => page.language));
    for (const language of project.languageVersions) if (!languages.has(language)) issues.push({ severity: "warning", code: "missing-translation-page", message: `Linked page group "${key}" has no ${language.toUpperCase()} page.`, language });
    if (new Set(pages.map((page) => page.template)).size > 1) issues.push({ severity: "warning", code: "translation-template-mismatch", message: `Linked page group "${key}" uses different templates.` });
    for (const page of pages) {
      const counterpart = pages.find((candidate) => candidate.id !== page.id && candidate.language !== page.language);
      if (counterpart && page.translationSourceRevision !== (counterpart.contentRevision ?? 0)) issues.push({ severity: "warning", code: "translation-may-be-stale", message: `Page ${page.pageNumber} ${page.language.toUpperCase()} may be outdated relative to its linked page.`, pageId: page.id, language: page.language });
    }
  }

  // --- page numbering, per language version ---
  for (const language of project.languageVersions) {
    const pages = project.pages
      .filter((p) => p.language === language)
      .sort((a, b) => a.pageNumber - b.pageNumber);
    const seen = new Map<number, number>();
    for (const p of pages) seen.set(p.pageNumber, (seen.get(p.pageNumber) ?? 0) + 1);
    for (const [num, count] of seen) {
      if (count > 1) {
        issues.push({
          severity: "error",
          code: "duplicate-page-number",
          message: `Page number ${num} is used ${count} times in the ${language.toUpperCase()} version.`,
          language,
          fix: { kind: "renumber", language },
        });
      }
    }
    for (let i = 1; i < pages.length; i++) {
      const gap = pages[i].pageNumber - pages[i - 1].pageNumber;
      if (gap > 1) {
        issues.push({
          severity: "warning",
          code: "broken-sequence",
          message: `Page numbers jump from ${pages[i - 1].pageNumber} to ${pages[i].pageNumber} in the ${language.toUpperCase()} version.`,
          language,
          fix: { kind: "renumber", language },
        });
      }
    }
    if (pages.length && pages[0].pageNumber !== 1) {
      issues.push({
        severity: "warning",
        code: "broken-sequence",
        message: `The ${language.toUpperCase()} version starts at page ${pages[0].pageNumber}, not 1.`,
        language,
        fix: { kind: "renumber", language },
      });
    }
  }

  // --- assets ---
  if (project.assets.coverImage) {
    usedImages.add(project.assets.coverImage);
    if (!images.has(project.assets.coverImage)) {
      issues.push({
        severity: "error",
        code: "missing-image",
        message: `Cover image "${project.assets.coverImage}" is not uploaded.`,
      });
    }
  }
  for (const filename of images.keys()) {
    if (!usedImages.has(filename)) {
      issues.push({
        severity: "warning",
        code: "unused-image",
        message: `Uploaded image "${filename}" is not used on any page.`,
        fix: { kind: "remove-image", filename },
      });
    }
  }
  const lowercase = new Map<string, string[]>();
  for (const filename of images.keys()) {
    const key = filename.toLowerCase();
    lowercase.set(key, [...(lowercase.get(key) ?? []), filename]);
  }
  for (const group of lowercase.values()) {
    if (group.length > 1) {
      issues.push({
        severity: "warning",
        code: "duplicate-filename",
        message: `Filenames differ only by case: ${group.join(", ")} — exports may overwrite each other.`,
      });
    }
  }
  for (const filename of images.keys()) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)) issues.push({ severity: "warning", code: "unsafe-export-filename", message: `Filename "${filename}" contains spaces or unsafe export characters.` });
  }

  if (project.projectMeta.outputProfile === "etsy-digital-product") {
    for (const language of project.languageVersions) {
      const listing = project.projectMeta.listing?.[language];
      if (!listing) issues.push({ severity: "warning", code: "etsy-listing-incomplete", message: `${language.toUpperCase()} Etsy listing uses generated defaults; review it before publishing.`, language });
      if ((listing?.title?.length ?? 0) > 140) issues.push({ severity: "error", code: "etsy-title-too-long", message: `${language.toUpperCase()} Etsy title exceeds 140 characters.`, language });
      if ((listing?.tags?.length ?? 0) > 13 || listing?.tags?.some((tag) => tag.length > 20)) issues.push({ severity: "error", code: "etsy-tags-invalid", message: `${language.toUpperCase()} Etsy tags exceed the 13-tag or 20-character limit.`, language });
      if (listing && (!listing.description?.trim() || !listing.customerReadme?.trim())) issues.push({ severity: "warning", code: "etsy-assets-incomplete", message: `${language.toUpperCase()} Etsy description or customer README is incomplete.`, language });
    }
  }

  // --- project-level palettes ---
  for (const palette of project.palettes) {
    palette.colors.forEach((color, index) => {
      if (!isValidHex(color.hex)) {
        const normalized = normalizeHex(color.hex ?? "");
        issues.push({
          severity: "error",
          code: "invalid-hex",
          message: `Palette "${palette.name}": color "${color.name}" has invalid HEX "${color.hex || "(empty)"}".`,
          fix: normalized
            ? { kind: "project-palette-hex", paletteId: palette.id, index, hex: normalized }
            : undefined,
        });
      }
    });
    if (palette.colors.length < 3) {
      issues.push({
        severity: "warning",
        code: "incomplete-palette",
        message: `Palette "${palette.name}" has fewer than 3 colors.`,
      });
    }
  }

  const order: Record<IssueSeverity, number> = { error: 0, warning: 1 };
  return issues.sort(
    (a, b) => order[a.severity] - order[b.severity] || (a.pageNumber ?? 0) - (b.pageNumber ?? 0),
  );
}

export function errorCount(issues: Issue[]): number {
  return issues.filter((i) => i.severity === "error").length;
}

export function issuesAsReport(project: Project, issues: Issue[]): string {
  const lines: string[] = [
    `QC REPORT — ${project.projectMeta.title}`,
    `Generated: ${new Date().toISOString()}`,
    `Product type: ${project.projectMeta.productType}`,
    `Languages: ${project.languageVersions.join(", ")}`,
    `Pages: ${project.pages.length}`,
    "",
  ];
  if (!issues.length) {
    lines.push("No issues found. All checks passed.");
  } else {
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    lines.push(`${errors.length} error(s), ${warnings.length} warning(s)`, "");
    for (const issue of issues) {
      const where = issue.pageNumber
        ? ` [page ${issue.pageNumber}${issue.language ? ` / ${issue.language}` : ""}]`
        : issue.language
          ? ` [${issue.language}]`
          : "";
      lines.push(`${issue.severity.toUpperCase()}${where} (${issue.code}): ${issue.message}`);
    }
  }
  return lines.join("\n");
}

export function missingAssetsReport(project: Project, images: Map<string, ImageAsset>): string {
  const lines: string[] = [`MISSING ASSETS REPORT — ${project.projectMeta.title}`, ""];
  let missing = 0;
  for (const page of project.pages) {
    for (const filename of imageFilenamesForPage(page)) {
      if (!images.has(filename)) {
        missing++;
        lines.push(`Page ${page.pageNumber} (${page.language}): missing "${filename}"`);
      }
    }
  }
  if (project.assets.coverImage && !images.has(project.assets.coverImage)) {
    missing++;
    lines.push(`Project cover: missing "${project.assets.coverImage}"`);
  }
  lines.push("", missing ? `${missing} missing image(s).` : "All referenced images are present.");
  return lines.join("\n");
}
