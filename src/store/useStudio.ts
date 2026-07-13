import { create } from "zustand";
import type { FieldValue, ImageAsset, Language, Page, Palette, ProductionImageStatus, Project } from "../types/project";
import { migrateProject, newId } from "../types/project";
import * as db from "../core/storage/db";
import { clearImageUrls, revokeImageUrl } from "../core/assets/imageStore";

export type Screen = "dashboard" | "editor";
export type SaveState = "saved" | "saving" | "error";

const HISTORY_LIMIT = 50;
/** Edits with the same label within this window collapse into one undo step. */
const BURST_MS = 900;

interface StudioState {
  projects: Project[];
  project: Project | null;
  images: Map<string, ImageAsset>;
  imageRevision: number;
  screen: Screen;
  selectedPageId: string | null;
  activeLanguage: Language;
  loading: boolean;
  saveState: SaveState;
  past: Project[];
  future: Project[];

  init(): Promise<void>;
  openProject(id: string): Promise<void>;
  closeProject(): void;
  createProject(project: Project): Promise<void>;
  removeProject(id: string): Promise<void>;
  duplicateProject(id: string, copySuffix: string): Promise<void>;
  updateProject(mutator: (p: Project) => void): void;
  updateStoredProject(id: string, mutator: (p: Project) => void): Promise<void>;

  undo(): void;
  redo(): void;

  selectPage(id: string | null): void;
  setActiveLanguage(lang: Language): void;
  addPage(page: Omit<Page, "id">): void;
  duplicatePage(id: string): void;
  removePage(id: string): void;
  movePage(id: string, direction: -1 | 1): void;
  reorderPage(dragId: string, dropId: string): void;
  renumberPages(language: Language): void;
  setPageField(pageId: string, field: string, value: FieldValue): void;
  removePageField(pageId: string, field: string): void;
  setPageTemplate(pageId: string, template: string): void;
  setPageNumber(pageId: string, n: number): void;
  setPageLanguage(pageId: string, lang: Language): void;

  addImages(assets: ImageAsset[]): Promise<void>;
  removeImage(filename: string): Promise<void>;
  setProductionStatus(filename: string, status: ProductionImageStatus, rejectionReason?: string): void;

  setPalettes(palettes: Palette[]): void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastHistoryLabel = "";
let lastHistoryTime = 0;
const lastSnapshotAt = new Map<string, number>();

export const useStudio = create<StudioState>((set, get) => {
  /** Snapshot the current project into the undo stack (call BEFORE mutating). */
  function checkpoint(label: string) {
    const { project, past } = get();
    if (!project) return;
    const now = Date.now();
    if (label === lastHistoryLabel && now - lastHistoryTime < BURST_MS && past.length > 0) {
      lastHistoryTime = now;
      set({ future: [] });
      return;
    }
    lastHistoryLabel = label;
    lastHistoryTime = now;
    const nextPast = [...past, structuredClone(project)];
    if (nextPast.length > HISTORY_LIMIT) nextPast.shift();
    set({ past: nextPast, future: [] });
  }

  function persist() {
    const { project } = get();
    if (!project) return;
    project.updatedAt = new Date().toISOString();
    if (saveTimer) clearTimeout(saveTimer);
    const snapshot = structuredClone(project);
    set({ saveState: "saving" });
    saveTimer = setTimeout(() => {
      void db.saveProject(snapshot).then(async () => {
        if (get().project?.id === snapshot.id) set({ saveState: "saved" });
        const last = lastSnapshotAt.get(snapshot.id) ?? 0;
        if (Date.now() - last >= 15 * 60 * 1000) {
          await db.saveSnapshot(snapshot, "Automatische snapshot");
          lastSnapshotAt.set(snapshot.id, Date.now());
        }
      }).catch(() => set({ saveState: "error" }));
    }, 300);
    set({
      project: { ...project },
      projects: get().projects.map((p) => (p.id === project.id ? { ...project } : p)),
    });
  }

  function restore(project: Project) {
    set({ project });
    persist();
  }

  return {
    projects: [],
    project: null,
    images: new Map(),
    imageRevision: 0,
    screen: "dashboard",
    selectedPageId: null,
    activeLanguage: "en",
    loading: true,
    saveState: "saved",
    past: [],
    future: [],

    async init() {
      const projects = (await db.loadProjects()).map((project) => migrateProject(project));
      await Promise.all(projects.map((project) => db.saveProject(project)));
      projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      set({ projects, loading: false });
    },

    async openProject(id) {
      const project = get().projects.find((p) => p.id === id);
      if (!project) return;
      clearImageUrls();
      const assets = await db.loadImages(id);
      const images = new Map(assets.map((a) => [a.filename, a] as const));
      lastHistoryLabel = "";
      set({
        project: structuredClone(project),
        images,
        imageRevision: get().imageRevision + 1,
        screen: "editor",
        selectedPageId: project.pages[0]?.id ?? null,
        activeLanguage: project.languageVersions[0] ?? "en",
        past: [],
        future: [],
        saveState: "saved",
      });
    },

    closeProject() {
      clearImageUrls();
      set({
        project: null,
        images: new Map(),
        imageRevision: get().imageRevision + 1,
        screen: "dashboard",
        selectedPageId: null,
        past: [],
        future: [],
      });
    },

    async createProject(project) {
      await db.saveProject(project);
      set({ projects: [project, ...get().projects] });
      await get().openProject(project.id);
    },

    async removeProject(id) {
      await db.deleteProject(id);
      await db.deleteThumb(id).catch(() => {});
      set({ projects: get().projects.filter((p) => p.id !== id) });
      if (get().project?.id === id) get().closeProject();
    },

    async duplicateProject(id, copySuffix) {
      const source = get().projects.find((p) => p.id === id);
      if (!source) return;
      const clone = structuredClone(source);
      clone.id = newId();
      clone.projectMeta.title = `${clone.projectMeta.title} (${copySuffix})`;
      clone.createdAt = clone.updatedAt = new Date().toISOString();
      const pageIds = new Map<string, string>();
      for (const page of clone.pages) { const old = page.id; page.id = newId(); pageIds.set(old, page.id); }
      for (const record of clone.production?.images ?? []) if (record.pageId && pageIds.has(record.pageId)) record.pageId = pageIds.get(record.pageId);
      await db.saveProject(clone);
      const assets = await db.loadImages(id);
      for (const asset of assets) await db.saveImage(clone.id, asset);
      set({ projects: [clone, ...get().projects] });
    },

    updateProject(mutator) {
      const { project } = get();
      if (!project) return;
      checkpoint("project-settings");
      mutator(project);
      persist();
    },

    undo() {
      const { past, future, project } = get();
      if (!past.length || !project) return;
      const previous = past[past.length - 1];
      lastHistoryLabel = "";
      set({
        past: past.slice(0, -1),
        future: [...future, structuredClone(project)].slice(-HISTORY_LIMIT),
      });
      restore(previous);
    },

    redo() {
      const { past, future, project } = get();
      if (!future.length || !project) return;
      const next = future[future.length - 1];
      lastHistoryLabel = "";
      set({
        future: future.slice(0, -1),
        past: [...past, structuredClone(project)].slice(-HISTORY_LIMIT),
      });
      restore(next);
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
      checkpoint(`add-page-${Date.now()}`);
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
      checkpoint(`dup-page-${Date.now()}`);
      const copy: Page = structuredClone(src);
      copy.id = newId();
      copy.pageNumber =
        Math.max(...project.pages.filter((p) => p.language === src.language).map((p) => p.pageNumber)) + 1;
      project.pages.push(copy);
      project.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
      set({ selectedPageId: copy.id });
    },

    removePage(id) {
      const { project, selectedPageId } = get();
      if (!project) return;
      checkpoint(`remove-page-${id}`);
      project.pages = project.pages.filter((p) => p.id !== id);
      persist();
      if (selectedPageId === id) set({ selectedPageId: project.pages[0]?.id ?? null });
    },

    movePage(id, direction) {
      const { project } = get();
      if (!project) return;
      const page = project.pages.find((p) => p.id === id);
      if (!page) return;
      const sorted = project.pages
        .filter((p) => p.language === page.language)
        .sort((a, b) => a.pageNumber - b.pageNumber);
      const idx = sorted.findIndex((p) => p.id === id);
      const other = sorted[idx + direction];
      if (idx < 0 || !other) return;
      checkpoint(`move-page-${id}`);
      [page.pageNumber, other.pageNumber] = [other.pageNumber, page.pageNumber];
      project.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
    },

    reorderPage(dragId, dropId) {
      const { project } = get();
      if (!project || dragId === dropId) return;
      const drag = project.pages.find((p) => p.id === dragId);
      const drop = project.pages.find((p) => p.id === dropId);
      if (!drag || !drop || drag.language !== drop.language) return;
      checkpoint(`reorder-${dragId}-${dropId}`);
      const lang = drag.language;
      const sorted = project.pages
        .filter((p) => p.language === lang)
        .sort((a, b) => a.pageNumber - b.pageNumber);
      const numbers = sorted.map((p) => p.pageNumber);
      const fromIdx = sorted.findIndex((p) => p.id === dragId);
      const toIdx = sorted.findIndex((p) => p.id === dropId);
      sorted.splice(toIdx, 0, sorted.splice(fromIdx, 1)[0]);
      sorted.forEach((p, i) => (p.pageNumber = numbers[i]));
      project.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
    },

    renumberPages(language) {
      const { project } = get();
      if (!project) return;
      checkpoint("renumber");
      const sorted = project.pages
        .filter((p) => p.language === language)
        .sort((a, b) => a.pageNumber - b.pageNumber);
      sorted.forEach((p, i) => (p.pageNumber = i + 1));
      project.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
    },

    setPageField(pageId, field, value) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      checkpoint(`field-${pageId}-${field}`);
      page.fields = { ...page.fields, [field]: value };
      page.contentRevision = (page.contentRevision ?? 0) + 1;
      persist();
    },

    removePageField(pageId, field) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      checkpoint(`remove-field-${pageId}-${field}`);
      const { [field]: _removed, ...rest } = page.fields;
      page.fields = rest;
      page.contentRevision = (page.contentRevision ?? 0) + 1;
      persist();
    },

    setPageTemplate(pageId, template) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      checkpoint(`template-${pageId}`);
      page.template = template;
      page.contentRevision = (page.contentRevision ?? 0) + 1;
      persist();
    },

    setPageNumber(pageId, n) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page || !Number.isFinite(n) || n < 1) return;
      checkpoint(`pagenum-${pageId}`);
      page.pageNumber = Math.floor(n);
      project!.pages.sort((a, b) => a.pageNumber - b.pageNumber);
      persist();
    },

    setPageLanguage(pageId, lang) {
      const { project } = get();
      const page = project?.pages.find((p) => p.id === pageId);
      if (!page) return;
      checkpoint(`pagelang-${pageId}`);
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
        const record = project.production?.images.find((item) => item.filename === asset.filename);
        if (record && record.status === "planned") {
          record.status = "uploaded";
          record.updatedAt = new Date().toISOString();
        }
      }
      set({ images: next });
      set({ imageRevision: get().imageRevision + 1 });
      persist();
    },

    async removeImage(filename) {
      const { project, images } = get();
      if (!project) return;
      revokeImageUrl(filename);
      const next = new Map(images);
      next.delete(filename);
      await db.deleteImage(project.id, filename);
      set({ images: next });
      set({ imageRevision: get().imageRevision + 1 });
      const record = project.production?.images.find((item) => item.filename === filename);
      if (record) {
        record.status = "planned";
        record.updatedAt = new Date().toISOString();
        persist();
      }
    },

    async updateStoredProject(id, mutator) {
      const source = get().projects.find((item) => item.id === id);
      if (!source) return;
      const updated = structuredClone(source);
      mutator(updated);
      updated.updatedAt = new Date().toISOString();
      await db.saveProject(updated);
      set({ projects: get().projects.map((item) => item.id === id ? updated : item) });
    },

    setProductionStatus(filename, status, rejectionReason) {
      const { project } = get();
      const record = project?.production?.images.find((item) => item.filename === filename);
      if (!record) return;
      checkpoint(`production-${filename}`);
      record.status = status;
      record.rejectionReason = status === "rejected" ? rejectionReason : undefined;
      record.updatedAt = new Date().toISOString();
      persist();
    },

    setPalettes(palettes) {
      const { project } = get();
      if (!project) return;
      checkpoint("palettes");
      project.palettes = palettes;
      persist();
    },
  };
});
