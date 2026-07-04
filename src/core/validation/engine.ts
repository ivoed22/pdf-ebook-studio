import type { ImageAsset, Language, Page, Project } from "../../types/project";
import { imageFilenamesForPage } from "../../types/project";
import { RENDERER_MAP, getTemplate, isKnownTemplate } from "../templates/registry";
import { isValidHex } from "../../pdf/components";

export type IssueSeverity = "error" | "warning";

export interface Issue {
  severity: IssueSeverity;
  code: string;
  message: string;
  pageId?: string;
  pageNumber?: number;
  language?: Language;
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

    for (const filename of imageFilenamesForPage(page)) {
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

    const palette = page.fields.palette;
    if (Array.isArray(palette) && palette.length && typeof palette[0] === "object") {
      const colors = palette as { name: string; hex: string }[];
      for (const color of colors) {
        if (!isValidHex(color.hex)) {
          issues.push({
            severity: "error",
            code: "invalid-hex",
            message: `Palette color "${color.name}" has invalid HEX "${color.hex || "(empty)"}".`,
            ...loc,
          });
        }
      }
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
        });
      }
    }
    if (pages.length && pages[0].pageNumber !== 1) {
      issues.push({
        severity: "warning",
        code: "broken-sequence",
        message: `The ${language.toUpperCase()} version starts at page ${pages[0].pageNumber}, not 1.`,
        language,
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

  // --- project-level palettes ---
  for (const palette of project.palettes) {
    for (const color of palette.colors) {
      if (!isValidHex(color.hex)) {
        issues.push({
          severity: "error",
          code: "invalid-hex",
          message: `Palette "${palette.name}": color "${color.name}" has invalid HEX "${color.hex || "(empty)"}".`,
        });
      }
    }
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
