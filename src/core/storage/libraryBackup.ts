import JSZip from "jszip";
import { saveAs } from "file-saver";
import { migrateProject, newId, type Project } from "../../types/project";
import * as db from "./db";
import { imageDimensions } from "../assets/imageStore";

function imageType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "gif" ? "image/gif" : "image/jpeg";
}

export async function exportLibraryBackup(projects: Project[]): Promise<void> {
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify({ format: "pdf-ebook-studio-library", version: 2, createdAt: new Date().toISOString(), projects: projects.length }, null, 2));
  for (const project of projects) {
    zip.file(`projects/${project.id}/project.json`, JSON.stringify(project, null, 2));
    for (const asset of await db.loadImages(project.id)) zip.file(`projects/${project.id}/images/${asset.filename}`, asset.blob);
    zip.file(`projects/${project.id}/snapshots.json`, JSON.stringify(await db.loadSnapshots(project.id), null, 2));
    zip.file(`projects/${project.id}/export-history.json`, JSON.stringify(await db.loadExportHistory(project.id), null, 2));
  }
  saveAs(await zip.generateAsync({ type: "blob" }), `pdf-ebook-studio-library-${new Date().toISOString().slice(0, 10)}.zip`);
  await db.setAppMeta("lastLibraryBackupAt", new Date().toISOString());
}

export async function importLibraryBackup(file: File): Promise<Project[]> {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry) throw new Error("Bibliotheekbackup mist manifest.json.");
  const manifest = JSON.parse(await manifestEntry.async("text"));
  if (manifest.format !== "pdf-ebook-studio-library") throw new Error("Dit is geen PDF Ebook Studio-bibliotheekbackup.");
  const restored: Project[] = [];
  const projectEntries = Object.values(zip.files).filter((entry) => !entry.dir && /projects\/[^/]+\/project\.json$/.test(entry.name));
  for (const entry of projectEntries) {
    const oldId = entry.name.split("/")[1];
    const project = migrateProject(JSON.parse(await entry.async("text")));
    project.id = newId();
    project.projectMeta.title += " (hersteld)";
    project.createdAt = project.updatedAt = new Date().toISOString();
    await db.saveProject(project);
    const prefix = `projects/${oldId}/images/`;
    for (const image of Object.values(zip.files).filter((candidate) => !candidate.dir && candidate.name.startsWith(prefix))) {
      const filename = image.name.slice(prefix.length);
      const blob = await image.async("blob");
      const typedBlob = blob.type ? blob : new Blob([blob], { type: imageType(filename) });
      await db.saveImage(project.id, { filename, type: typedBlob.type || imageType(filename), size: typedBlob.size, blob: typedBlob, ...(await imageDimensions(typedBlob)) });
    }
    const snapshotsEntry = zip.file(`projects/${oldId}/snapshots.json`);
    if (snapshotsEntry) {
      const snapshots = JSON.parse(await snapshotsEntry.async("text")) as db.SnapshotRecord[];
      for (const snapshot of snapshots.slice(0, 20)) { const snapshotProject = migrateProject(snapshot.project); snapshotProject.id = project.id; snapshotProject.projectMeta.title = project.projectMeta.title; await db.saveSnapshot(snapshotProject, `Hersteld: ${snapshot.reason}`); }
    }
    const historyEntry = zip.file(`projects/${oldId}/export-history.json`);
    if (historyEntry) {
      const history = JSON.parse(await historyEntry.async("text")) as db.ExportHistoryRecord[];
      for (const item of history) await db.saveExportHistory({ projectId: project.id, languages: item.languages, profile: item.profile, qcStatus: item.qcStatus, version: item.version, filename: item.filename });
    }
    restored.push(project);
  }
  return restored;
}
