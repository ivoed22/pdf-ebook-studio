import {
  createEmptyProject,
  newId,
  type FieldValue,
  type Language,
  type Page,
  type PaletteColor,
  type ProductType,
  type Project,
  LANGUAGES,
  PRODUCT_TYPES,
  OUTPUT_PROFILES,
} from "../../types/project";

export interface ImportResult {
  project: Project;
  warnings: string[];
}

/** Section heading (### Name) -> canonical field key per the input format spec. */
const SECTION_FIELD_MAP: Record<string, string> = {
  // interior / exterior
  "why it works": "whyItWorks",
  "how to recreate": "howToRecreate",
  palette: "palette",
  materials: "materials",
  "design notes": "designNotes",
  "design concept": "designConcept",
  "planting notes": "plantingNotes",
  "maintenance notes": "maintenanceNotes",
  "style tags": "styleTags",
  "image notes": "imageNotes",
  // recipes
  ingredients: "ingredients",
  steps: "steps",
  notes: "notes",
  nutrition: "nutrition",
  // general ebook
  body: "body",
  quote: "quote",
  checklist: "checklistItems",
  "checklist items": "checklistItems",
  "key takeaways": "keyTakeaways",
  // generic
  intro: "intro",
  text: "body",
  items: "items",
  columns: "columns",
  rows: "rows",
};

/** Field keys whose section content should stay a list of strings. */
const LIST_FIELDS = new Set([
  "designNotes",
  "plantingNotes",
  "maintenanceNotes",
  "ingredients",
  "steps",
  "checklistItems",
  "keyTakeaways",
  "styleTags",
  "items",
  "columns",
  "rows",
  "images",
]);

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

function parseKeyValue(line: string): [string, string] | null {
  const m = /^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
  if (!m) return null;
  return [m[1], m[2].trim()];
}

function parsePaletteLines(lines: string[]): PaletteColor[] {
  const colors: PaletteColor[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^[-*]\s*/, "").trim();
    if (!line) continue;
    // "Name | #HEX" or "Name #HEX" or bare "#HEX"
    const hexMatch = HEX_RE.exec(line);
    if (hexMatch) {
      const name = line
        .slice(0, hexMatch.index)
        .replace(/[|·:,-]+\s*$/, "")
        .trim();
      colors.push({ name: name || hexMatch[0], hex: hexMatch[0].toUpperCase() });
    } else {
      colors.push({ name: line, hex: "" });
    }
  }
  return colors;
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").trim();
}

function sectionToFieldValue(fieldKey: string, lines: string[]): FieldValue {
  const nonEmpty = lines.map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
  if (fieldKey === "palette") return parsePaletteLines(nonEmpty);
  const isListy =
    nonEmpty.length > 0 && nonEmpty.every((l) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(l));
  if (LIST_FIELDS.has(fieldKey) || isListy) {
    return nonEmpty.map(stripListMarker).filter(Boolean);
  }
  return nonEmpty.join("\n").trim();
}

interface RawBlock {
  header: Record<string, string>;
  sections: { name: string; lines: string[] }[];
  freeLines: string[];
}

function parsePageBlock(block: string): RawBlock {
  const lines = block.split(/\r?\n/);
  const header: Record<string, string> = {};
  const sections: { name: string; lines: string[] }[] = [];
  const freeLines: string[] = [];
  let current: { name: string; lines: string[] } | null = null;
  let inHeader = true;

  for (const line of lines) {
    const headingMatch = /^#{2,4}\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      current = { name: headingMatch[1].trim(), lines: [] };
      sections.push(current);
      inHeader = false;
      continue;
    }
    if (current) {
      current.lines.push(line);
      continue;
    }
    if (inHeader) {
      if (line.trim() === "") continue;
      const kv = parseKeyValue(line.trim());
      if (kv) {
        header[kv[0]] = kv[1];
        continue;
      }
      inHeader = false;
    }
    freeLines.push(line);
  }
  return { header, sections, freeLines };
}

/** Header keys that belong to the page itself, not to `fields`. */
const PAGE_META_KEYS = new Set(["pageNumber", "template", "language"]);

export function importMarkdown(markdown: string, warnings: string[] = []): ImportResult {
  const text = markdown.replace(/^﻿/, "");

  // --- frontmatter ---
  let meta: Record<string, string> = {};
  let rest = text;
  const fmMatch = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/.exec(text);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = parseKeyValue(line.trim());
      if (kv) meta[kv[0]] = kv[1];
    }
    rest = text.slice(fmMatch[0].length);
  } else {
    warnings.push("No frontmatter (--- block) found; using defaults for project metadata.");
  }

  const productType = (PRODUCT_TYPES as readonly string[]).includes(meta.productType)
    ? (meta.productType as ProductType)
    : "general-ebook";
  if (meta.productType && productType !== meta.productType) {
    warnings.push(`Unknown productType "${meta.productType}" — defaulted to general-ebook.`);
  }
  const language: Language = (LANGUAGES as readonly string[]).includes(meta.language)
    ? (meta.language as Language)
    : "en";

  const project = createEmptyProject({
    title: meta.projectTitle || meta.title || "Untitled Project",
    productType,
    theme: meta.theme || "warm-minimal",
    languageVersions: [language],
  });
  if (meta.subtitle) project.projectMeta.subtitle = meta.subtitle;
  if (meta.author) project.projectMeta.author = meta.author;
  if (meta.year) project.projectMeta.year = meta.year;
  if (meta.outputProfile && (OUTPUT_PROFILES as readonly string[]).includes(meta.outputProfile)) {
    project.projectMeta.outputProfile = meta.outputProfile as (typeof OUTPUT_PROFILES)[number];
  }
  project.assets = {
    imageFolder: meta.imageFolder,
    coverImage: meta.coverImage,
  };

  // --- pages ---
  const blocks = rest
    .split(/<!--\s*PAGE\s*-->/i)
    .map((b) => b.trim())
    .filter((b) => b !== "");

  const languagesSeen = new Set<Language>(project.languageVersions);
  const pages: Page[] = [];

  for (const [i, block] of blocks.entries()) {
    const raw = parsePageBlock(block);
    const fields: Record<string, FieldValue> = {};

    for (const [key, value] of Object.entries(raw.header)) {
      if (!PAGE_META_KEYS.has(key)) fields[key] = value;
    }
    for (const section of raw.sections) {
      const canonical =
        SECTION_FIELD_MAP[section.name.toLowerCase()] ??
        section.name
          .toLowerCase()
          .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase());
      fields[canonical] = sectionToFieldValue(canonical, section.lines);
    }
    const free = raw.freeLines.join("\n").trim();
    if (free && !fields.body) fields.body = free;

    const pageNumber = Number.parseInt(raw.header.pageNumber ?? "", 10);
    const template = raw.header.template ?? "";
    const pageLanguage: Language = (LANGUAGES as readonly string[]).includes(raw.header.language)
      ? (raw.header.language as Language)
      : language;
    languagesSeen.add(pageLanguage);

    if (!template) warnings.push(`Page block ${i + 1}: missing "template" — page kept, fix in editor.`);
    if (!Number.isFinite(pageNumber)) {
      warnings.push(`Page block ${i + 1}: missing/invalid "pageNumber" — assigned ${i + 1}.`);
    }

    pages.push({
      id: newId(),
      pageNumber: Number.isFinite(pageNumber) ? pageNumber : i + 1,
      template,
      language: pageLanguage,
      fields,
    });
  }

  if (pages.length === 0) {
    warnings.push("No <!-- PAGE --> blocks found — project imported without pages.");
  }

  project.languageVersions = Array.from(languagesSeen);
  project.pages = pages.sort((a, b) => a.pageNumber - b.pageNumber || (a.language < b.language ? -1 : 1));
  return { project, warnings };
}
