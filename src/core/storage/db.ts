import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ImageAsset, Project } from "../../types/project";

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
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null;

function db(): Promise<IDBPDatabase<StudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StudioDB>("pdf-ebook-studio", 1, {
      upgrade(d) {
        d.createObjectStore("projects", { keyPath: "id" });
        const images = d.createObjectStore("images", { keyPath: ["projectId", "filename"] });
        images.createIndex("byProject", "projectId");
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
