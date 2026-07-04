import { create } from "zustand";
import type { FieldValue, ImageAsset, Language, Page, Palette, Project } from "../types/project";
import { newId } from "../types/project";
import * as db from "../core/storage/db";
import { clearImageUrls, revokeImageUrl } from "../core/assets/imageStore";

export type Screen = "dashboard" | "editor";

interface StudioState {
  projects: Project[];
  project: Project | null;
  images: Map<string, ImageAsset>;
  screen: Screen;
  selectedPageId: string | null;
  activeLanguage: Language;
  loading: boolean;

  init(): Promise<void>;
  openProject(id: string): Promise<void>;
  closeProject(): void;
  createProject(project: Project): Promise<void>;
  removeProject(id: string): Promise<void>;
  updateProject(mutator: (p: Project) => void): void;

  selectPage(id: string | null): void;
  setActiveLanguage(lang: Language): void;
  addPage(page: Omit<Page, "id">): void;
  duplicatePage(id: string): void;
  removePage(id: string): void;
  movePage(id: string, direction: -1 | 1): void;
  setPageField(pageId: string, field: string, value: FieldValue): void;
  removePageField(pageId: string, field: string): void;
  setPageTemplate(pageId: string, template: string): void;
  setPageNumber(pageId: string, n: number): void;
  setPageLanguage(pageId: string, lang: Language): void;

  addImages(assets: ImageAsset[]): Promise<void>;
  removeImage(filename: string): Promise<void>;

  setPalettes(palettes: Palette[]): void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useStudio = create<StudioState>((set, get) => {
  function persist() {
    const { project } = get();
    if (!project) return;
    project.updatedAt = new Date().toISOString();
    if (saveTimer) clearTimeout(saveTimer);
    const snapshot = structuredClone(project);
    saveTimer = setTimeout(() => void db.saveProject(snapshot), 300);
    set({
      project: { ...project },
      projects: get().projects.map((p) => (p.id === project.id ? { ...project } : p)),
    });
  }

  return {
    projects: [],
    project: null,
    images: new Map(),
    screen: "dashboard",
    selectedPageId: null,
    activeLanguage: "en",
    loading: true,

    async init() {
      const projects = await db.loadProjects();
      projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      set({ projects, loading: false });
    },

    async openProject(id) {
      const project = get().projects.find((p) => p.id === id);
      if (!project) return;
      clearImageUrls();
      const assets = await db.loadImages(id);
      const images = new Map(assets.map((a) => [a.filename, a] as const));
      set({
        project: structuredClone(project),
        images,
        screen: "editor",
        selectedPageId: project.pages[0]?.id ?? null,
        activeLanguage: project.languageVersions[0] ?? "en",
      });
    },

    closeProject() {
      clearImageUrls();
      set({ project: null, images: new Map(), screen: "dashboard", selectedPageId: null });
    },

    async createProject(project) {
      await db.saveProject(project);
      set({ projects: [project, ...get().projects] });
      await get().openProject(project.id);
    },

    async removeProject(id) {
      await db.deleteProject(id);
      set({ projects: get().projects.filter((p) => p.id !== id) });
      if (get().project?.id === id) get().closeProject();
    },

    updateProject(mutator) {
      const { project } = get();
      if (!project) return;
      mutator(project);
      persist();
    },

    selectPage(id) {
      set({ selectedPageId: id });
    },

    setActiveLanguage(lang) {
      set({ activeLanguage: lang });
      const { project, selectedPageId } = get();
      if (!project) return;
      const selected = project.pages.find((p) => p.id === selectedPageId);
      if (!selected || selected.language !== lang) {
        const first = project.pages.find((p) => p.language === lang);
        set({ selectedPageId: first?.id ?? null });
      }
    },

    addPage(page) {
      const { project } = get();
      if (!project) return;
      const withId: Page = { ...page, id: newId() };
      project.pages.push(withId);
      project.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
      set({ selectedPageId: withId.id });
    },

    duplicatePage(id) {
      const { project } = get();
      if (!project) return;
      const src = project.pages.find((p) => p.id === id);
      if (!src) return;
      const copy: Page = structuredClone(src);
      copy.id = newId();
      copy.pageNumber = Math.max(...project.pages.map((p) => p.pageNumber)) + 1;
      project.pages.push(copy);
      persist();
      set({ selectedPageId: copy.id });
    },

    removePage(id) {
      const { project, selectedPageId } = get();
      if (!project) return;
      project.pages = project.pages.filter((p) => p.id !== id);
      persist();
      if (selectedPageId === id) set({ selectedPageId: project.pages[0]?.id ?? null });
    },

    movePage(id, direction) {
      const { project } = get();
      if (!project) return;
      const sorted = [...project.pages].sort((a, b) => a.pageNumber - b.pageNumber);
      const idx = sorted.findIndex((p) => p.id === id);
      const other = sorted[idx + direction];
      if (idx < 0 || !other) return;
      const page = sorted[idx];
      [page.pageNumber, other.pageNumber] = [other.pageNumber, page.pageNumber];
      project.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
    },

    setPageField(pageId, field, value) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      page.fields = { ...page.fields, [field]: value };
      persist();
    },

    removePageField(pageId, field) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      const { [field]: _removed, ...rest } = page.fields;
      page.fields = rest;
      persist();
    },

    setPageTemplate(pageId, template) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      page.template = template;
      persist();
    },

    setPageNumber(pageId, n) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page || !Number.isFinite(n) || n < 1) return;
      page.pageNumber = Math.floor(n);
      project!.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
    },

    setPageLanguage(pageId, lang) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      page.language = lang;
      if (!project!.languageVersions.includes(lang)) project!.languageVersions.push(lang);
      persist();
    },

    async addImages(assets) {
      const { project, images } = get();
      if (!project) return;
      const next = new Map(images);
      for (const asset of assets) {
        revokeImageUrl(asset.filename);
        next.set(asset.filename, asset);
        await db.saveImage(project.id, asset);
      }
      set({ images: next });
    },

    async removeImage(filename) {
      const { project, images } = get();
      if (!project) return;
      revokeImageUrl(filename);
      const next = new Map(images);
      next.delete(filename);
      await db.deleteImage(project.id, filename);
      set({ images: next });
    },

    setPalettes(palettes) {
      const { project } = get();
      if (!project) return;
      project.palettes = palettes;
      persist();
    },
  };
});
