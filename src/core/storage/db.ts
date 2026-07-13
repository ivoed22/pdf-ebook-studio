import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { imageFilenamesForPage, type ImageAsset, type Project } from "../../types/project";

interface ThumbRecord {
  projectId: string;
  updatedAt: string;
  dataUrl: string;
}

export interface SnapshotRecord { id: string; projectId: string; createdAt: string; reason: string; project: Project }
export interface AppMetaRecord { key: string; value: unknown }
export interface ExportHistoryRecord {
  id: string;
  projectId: string;
  createdAt: string;
  languages: string[];
  profile: string;
  qcStatus: "pass" | "draft";
  version: number;
  filename: string;
}

interface StudioDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  images: {
    key: [string, string]; // [projectId, filename]
    value: ImageAsset & { projectId: string };
    indexes: { byProject: string };
  };
  thumbs: {
    key: string; // projectId
    value: ThumbRecord;
  };
  snapshots: { key: string; value: SnapshotRecord; indexes: { byProject: string } };
  appMeta: { key: string; value: AppMetaRecord };
  exportHistory: { key: string; value: ExportHistoryRecord; indexes: { byProject: string } };
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null;

function db(): Promise<IDBPDatabase<StudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StudioDB>("pdf-ebook-studio", 4, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore("projects", { keyPath: "id" });
          const images = d.createObjectStore("images", { keyPath: ["projectId", "filename"] });
          images.createIndex("byProject", "projectId");
        }
        if (oldVersion < 2) {
          d.createObjectStore("thumbs", { keyPath: "projectId" });
        }
        if (oldVersion < 3) {
          const snapshots = d.createObjectStore("snapshots", { keyPath: "id" });
          snapshots.createIndex("byProject", "projectId");
          d.createObjectStore("appMeta", { keyPath: "key" });
        }
        if (oldVersion < 4) {
          const history = d.createObjectStore("exportHistory", { keyPath: "id" });
          history.createIndex("byProject", "projectId");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: Project): Promise<void> {
  await (await db()).put("projects", project);
}

export async function loadProjects(): Promise<Project[]> {
  return (await db()).getAll("projects");
}

export async function deleteProject(id: string): Promise<void> {
  const d = await db();
  await d.delete("projects", id);
  const keys = await d.getAllKeysFromIndex("images", "byProject", id);
  const tx = d.transaction("images", "readwrite");
  for (const key of keys) await tx.store.delete(key);
  await tx.done;
  const snapshotKeys = await d.getAllKeysFromIndex("snapshots", "byProject", id);
  const snapshotTx = d.transaction("snapshots", "readwrite");
  for (const key of snapshotKeys) await snapshotTx.store.delete(key);
  await snapshotTx.done;
  const historyKeys = await d.getAllKeysFromIndex("exportHistory", "byProject", id);
  const historyTx = d.transaction("exportHistory", "readwrite");
  for (const key of historyKeys) await historyTx.store.delete(key);
  await historyTx.done;
}

export async function saveImage(projectId: string, asset: ImageAsset): Promise<void> {
  await (await db()).put("images", { ...asset, projectId });
}

export async function loadImages(projectId: string): Promise<ImageAsset[]> {
  return (await db()).getAllFromIndex("images", "byProject", projectId);
}

export async function deleteImage(projectId: string, filename: string): Promise<void> {
  await (await db()).delete("images", [projectId, filename]);
}

export async function saveThumb(projectId: string, updatedAt: string, dataUrl: string): Promise<void> {
  await (await db()).put("thumbs", { projectId, updatedAt, dataUrl });
}

export async function loadThumb(projectId: string): Promise<ThumbRecord | undefined> {
  return (await db()).get("thumbs", projectId);
}

export async function deleteThumb(projectId: string): Promise<void> {
  await (await db()).delete("thumbs", projectId);
}

export async function clearThumbs(): Promise<void> { await (await db()).clear("thumbs"); }

export async function projectStorage(project: Project): Promise<{ bytes: number; assets: number; unused: number }> {
  const assets = await loadImages(project.id);
  const used = new Set(project.pages.flatMap(imageFilenamesForPage));
  if (project.assets.coverImage) used.add(project.assets.coverImage);
  return { bytes: assets.reduce((sum, asset) => sum + asset.size, 0), assets: assets.length, unused: assets.filter((asset) => !used.has(asset.filename)).length };
}

export async function deleteUnusedAssets(project: Project): Promise<number> {
  const assets = await loadImages(project.id);
  const used = new Set(project.pages.flatMap(imageFilenamesForPage));
  if (project.assets.coverImage) used.add(project.assets.coverImage);
  const unused = assets.filter((asset) => !used.has(asset.filename));
  for (const asset of unused) await deleteImage(project.id, asset.filename);
  return unused.length;
}

export async function saveSnapshot(project: Project, reason: string): Promise<void> {
  const d = await db();
  const record: SnapshotRecord = { id: `${project.id}-${Date.now()}`, projectId: project.id, createdAt: new Date().toISOString(), reason, project: structuredClone(project) };
  await d.put("snapshots", record);
  const all = (await d.getAllFromIndex("snapshots", "byProject", project.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const stale of all.slice(20)) await d.delete("snapshots", stale.id);
}

export async function loadSnapshots(projectId: string): Promise<SnapshotRecord[]> {
  return (await (await db()).getAllFromIndex("snapshots", "byProject", projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveExportHistory(record: Omit<ExportHistoryRecord, "id" | "createdAt">): Promise<ExportHistoryRecord> {
  const value: ExportHistoryRecord = { ...record, id: `${record.projectId}-export-${Date.now()}`, createdAt: new Date().toISOString() };
  await (await db()).put("exportHistory", value);
  return value;
}

export async function loadExportHistory(projectId: string): Promise<ExportHistoryRecord[]> {
  return (await (await db()).getAllFromIndex("exportHistory", "byProject", projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setAppMeta(key: string, value: unknown): Promise<void> { await (await db()).put("appMeta", { key, value }); }
export async function getAppMeta<T>(key: string): Promise<T | undefined> { return (await (await db()).get("appMeta", key))?.value as T | undefined; }

export async function storageEstimate(): Promise<{ usage: number; quota: number }> {
  const estimate = await navigator.storage?.estimate?.();
  return { usage: estimate?.usage ?? 0, quota: estimate?.quota ?? 0 };
}
