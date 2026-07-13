import { useEffect, useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import * as db from "../core/storage/db";
import { exportLibraryBackup, importLibraryBackup } from "../core/storage/libraryBackup";
import { Dialog } from "./kit/Dialog";
import { toast } from "./kit/Toaster";
import { confirmDialog } from "./kit/ConfirmDialog";

interface Detail { id: string; title: string; bytes: number; assets: number; unused: number }

export function StorageManager({ onClose }: { onClose: () => void }) {
  const projects = useStudio((state) => state.projects);
  const init = useStudio((state) => state.init);
  const [estimate, setEstimate] = useState({ usage: 0, quota: 0 });
  const [lastBackup, setLastBackup] = useState<string>();
  const [details, setDetails] = useState<Detail[]>([]);
  const input = useRef<HTMLInputElement>(null);

  async function refresh() {
    setEstimate(await db.storageEstimate());
    setLastBackup(await db.getAppMeta<string>("lastLibraryBackupAt"));
    setDetails(await Promise.all(projects.map(async (project) => ({
      id: project.id,
      title: project.projectMeta.title,
      ...(await db.projectStorage(project)),
    }))));
  }

  useEffect(() => { void refresh(); }, [projects]);
  const percent = estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0;
  const backupOverdue = !lastBackup || Date.now() - new Date(lastBackup).getTime() > 7 * 24 * 60 * 60 * 1000;

  async function removeUnused() {
    const ok = await confirmDialog({
      title: "Ongebruikte beelden verwijderen?",
      message: "Alleen beelden die door geen enkele pagina of cover worden gebruikt, worden verwijderd.",
      confirmLabel: "Verwijder ongebruikte beelden",
      danger: true,
    });
    if (!ok) return;
    let total = 0;
    for (const project of projects) total += await db.deleteUnusedAssets(project);
    await refresh();
    toast.success(`${total} ongebruikte beelden verwijderd`);
  }

  return (
    <Dialog title="Lokale opslag en backups" description="Projecten en beelden blijven uitsluitend in deze browser." onClose={onClose} maxWidth="max-w-2xl">
      <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
        <div className="flex justify-between text-sm"><strong>{formatBytes(estimate.usage)} gebruikt</strong><span className="text-[var(--muted)]">{estimate.quota ? `${percent}% van ${formatBytes(estimate.quota)}` : "Quota onbekend"}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full bg-[var(--primary)]" style={{ width: `${Math.min(100, percent)}%` }} /></div>
        {backupOverdue && <div className="status-warning mt-4 rounded-xl p-3 text-sm"><strong>Backup aanbevolen.</strong> Er is langer dan zeven dagen geen volledige bibliotheekbackup gemaakt.</div>}
        <p className="mt-4 text-sm text-[var(--muted)]">Laatste volledige backup: {lastBackup ? new Date(lastBackup).toLocaleString() : "nog niet gemaakt"}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button className="btn-primary" onClick={() => void exportLibraryBackup(projects).then(() => { setLastBackup(new Date().toISOString()); toast.success("Bibliotheekbackup gemaakt"); })}>Exporteer bibliotheek</button>
          <button className="btn-secondary" onClick={() => input.current?.click()}>Herstel bibliotheek</button>
        </div>
        <input ref={input} className="hidden" type="file" accept=".zip" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importLibraryBackup(file).then(async (restored) => { await init(); toast.success(`${restored.length} project(en) hersteld`); onClose(); }).catch((error) => toast.error(error instanceof Error ? error.message : String(error)));
          event.target.value = "";
        }} />
        <p className="mt-4 text-xs text-[var(--muted)]">Herstellen maakt altijd nieuwe projectkopieën en overschrijft niets.</p>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-2"><p className="panel-title">Gebruik per project</p><button className="btn-ghost px-3" onClick={() => void Promise.all([db.clearThumbs(), import("./PreviewPane").then((module) => module.clearPreviewCache())]).then(() => toast.success("Previewcache geleegd"))}>Cache legen</button></div>
        <ul className="mt-3 max-h-52 space-y-2 overflow-auto">{details.map((detail) => <li key={detail.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{detail.title}</p><p className="text-xs text-[var(--muted)]">{detail.assets} beelden · {detail.unused} ongebruikt</p></div><span className="shrink-0 text-xs font-semibold">{formatBytes(detail.bytes)}</span></li>)}</ul>
        {details.some((detail) => detail.unused > 0) && <button className="btn-secondary mt-3 w-full" onClick={() => void removeUnused()}>Ongebruikte assets opruimen</button>}
      </section>
    </Dialog>
  );
}

function formatBytes(value: number): string {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
