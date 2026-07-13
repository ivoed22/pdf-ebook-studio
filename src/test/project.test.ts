import { describe, expect, it } from "vitest";
import { createEmptyProject, migrateProject } from "../types/project";
import { projectProgress } from "../core/production/progress";
import { validateProject } from "../core/validation/engine";

describe("project schema v2", () => {
  it("migrates an existing v1 project without losing pages", () => {
    const current = createEmptyProject({ title: "Test", productType: "general-ebook", theme: "warm-editorial", languageVersions: ["nl"] });
    const legacy = { ...current, schemaVersion: 1, production: undefined } as const;
    const migrated = migrateProject(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.production).toEqual({ qcStatus: "needs-images", images: [], batches: [] });
    expect(migrated.organization).toEqual({ tags: [], favorite: false, archived: false });
  });

  it("tracks the guided production flow", () => {
    const project = createEmptyProject({ title: "Test", productType: "general-ebook", theme: "warm-editorial", languageVersions: ["nl"] });
    expect(projectProgress(project)[0].state).toBe("not-started");
    project.pages.push({ id: "p1", pageNumber: 1, language: "nl", template: "guide-text-page", fields: { title: "Start", body: "Text" }, contentRevision: 0 });
    expect(projectProgress(project)[0].state).toBe("done");
  });

  it("blocks rejected production images through QC", () => {
    const project = createEmptyProject({ title: "Test", productType: "general-ebook", theme: "warm-editorial", languageVersions: ["nl"] });
    project.production!.images.push({ filename: "page-01.jpg", prompt: "Prompt", status: "rejected", updatedAt: new Date().toISOString() });
    expect(validateProject(project, new Map()).some((issue) => issue.code === "rejected-image" && issue.severity === "error")).toBe(true);
  });

  it("flags stale linked translations without changing their text", () => {
    const project = createEmptyProject({ title: "Test", productType: "general-ebook", theme: "warm-editorial", languageVersions: ["nl", "en"] });
    project.pages.push(
      { id: "nl", pageNumber: 1, language: "nl", template: "guide-text-page", fields: { title: "Titel", body: "Tekst" }, translationKey: "pair", contentRevision: 2, translationSourceRevision: 0 },
      { id: "en", pageNumber: 1, language: "en", template: "guide-text-page", fields: { title: "Title", body: "Text" }, translationKey: "pair", contentRevision: 1, translationSourceRevision: 0 },
    );
    const issues = validateProject(project, new Map());
    expect(issues.some((issue) => issue.code === "translation-may-be-stale")).toBe(true);
    expect(project.pages[1].fields.title).toBe("Title");
  });

  it("checks production dimensions and Etsy limits", () => {
    const project = createEmptyProject({ title: "Test", productType: "general-ebook", theme: "warm-editorial", languageVersions: ["nl"] });
    project.projectMeta.listing = { nl: { title: "x".repeat(141), tags: ["tag"], description: "beschrijving", customerReadme: "readme" } };
    project.production!.images.push({ filename: "wrong name.jpg", prompt: "Prompt", status: "uploaded", orientation: "landscape", updatedAt: new Date().toISOString() });
    const images = new Map([["wrong name.jpg", { filename: "wrong name.jpg", type: "image/jpeg", size: 10, blob: new Blob(), width: 300, height: 900 }]]);
    const issues = validateProject(project, images);
    expect(issues.some((issue) => issue.code === "etsy-title-too-long")).toBe(true);
    expect(issues.some((issue) => issue.code === "image-aspect-mismatch")).toBe(true);
    expect(issues.some((issue) => issue.code === "unsafe-export-filename")).toBe(true);
  });
});
