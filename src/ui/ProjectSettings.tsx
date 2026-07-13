import { useStudio } from "../store/useStudio";
import { THEMES } from "../data/themes/themes";
import { PRODUCT_TYPES, type ProductType } from "../types/project";
import { useT } from "../i18n/strings";
import { useEffect, useState } from "react";
import * as db from "../core/storage/db";
import { newId } from "../types/project";
import { toast } from "./kit/Toaster";

export default function ProjectSettings() {
  const project = useStudio((s) => s.project);
  const updateProject = useStudio((s) => s.updateProject);
  const t = useT();
  const createProject = useStudio((s) => s.createProject);
  const [snapshots, setSnapshots] = useState<db.SnapshotRecord[]>([]);
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");

  useEffect(() => { if (project) void db.loadSnapshots(project.id).then(setSnapshots); }, [project?.id, project?.updatedAt]);

  if (!project) return null;
  const meta = project.projectMeta;
  const matches = find ? project.pages.flatMap((page) => Object.entries(page.fields).flatMap(([field, value]) => {
    const text = typeof value === "string" ? value : Array.isArray(value) && typeof value[0] === "string" ? (value as string[]).join(" · ") : "";
    return text.includes(find) ? [{ page: page.pageNumber, language: page.language, field, text }] : [];
  })) : [];

  return (
    <div className="p-4">
      <label className="label">{t("title")}</label>
      <input
        className="input mb-3"
        value={meta.title}
        onChange={(e) => updateProject((p) => (p.projectMeta.title = e.target.value))}
      />
      <label className="label">{t("subtitle")}</label>
      <input
        className="input mb-3"
        value={meta.subtitle ?? ""}
        onChange={(e) => updateProject((p) => (p.projectMeta.subtitle = e.target.value))}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("authorBrand")}</label>
          <input
            className="input mb-3"
            value={meta.author ?? ""}
            onChange={(e) => updateProject((p) => (p.projectMeta.author = e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t("year")}</label>
          <input
            className="input mb-3"
            value={meta.year ?? ""}
            onChange={(e) => updateProject((p) => (p.projectMeta.year = e.target.value))}
          />
        </div>
      </div>

      <label className="label">{t("productType")}</label>
      <select
        className="input mb-3 cursor-pointer"
        value={meta.productType}
        onChange={(e) => updateProject((p) => (p.projectMeta.productType = e.target.value as ProductType))}
      >
        {PRODUCT_TYPES.map((pt) => (
          <option key={pt} value={pt}>
            {pt}
          </option>
        ))}
      </select>

      <label className="label">{t("theme")}</label>
      <div className="grid grid-cols-1 gap-2 mb-3">
        {THEMES.map((th) => (
          <button
            key={th.id}
            className={`rounded-md border p-2.5 text-left cursor-pointer ${
            meta.theme === th.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
            onClick={() =>
              updateProject((p) => {
                p.projectMeta.theme = th.id;
                delete p.projectMeta.themeColors;
              })
            }
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {th.defaultPalette.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-[var(--ink)]">{th.name}</span>
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">{th.description}</div>
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-[var(--muted)]">{t("themeFineTuneHint")}</p>

      <label className="label">{t("outputProfile")}</label>
      <select
        className="input mb-3 cursor-pointer"
        value={meta.outputProfile}
        onChange={(e) =>
          updateProject((p) => (p.projectMeta.outputProfile = e.target.value as typeof meta.outputProfile))
        }
      >
        <option value="etsy-digital-product">Etsy digital product</option>
        <option value="standard-pdf">Standard PDF</option>
      </select>

      <p className="text-xs text-[var(--muted)]">
        {t("settingsFootnote")}
      </p>

      <section className="mt-6 border-t border-[var(--border)] pt-5"><p className="panel-title">Projectorganisatie</p><label className="label mt-3">Map</label><input className="input mb-3" value={project.organization?.folder ?? ""} onChange={(event) => updateProject((draft) => { draft.organization ??= { tags: [], favorite: false, archived: false }; draft.organization.folder = event.target.value || undefined; })} placeholder="Bijvoorbeeld Kookboeken" /><label className="label">Tags</label><input className="input" value={(project.organization?.tags ?? []).join(", ")} onChange={(event) => updateProject((draft) => { draft.organization ??= { tags: [], favorite: false, archived: false }; draft.organization.tags = event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean); })} placeholder="recepten, zomer, etsy" /><div className="mt-3 grid grid-cols-2 gap-2"><label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm"><input type="checkbox" checked={project.organization?.favorite ?? false} onChange={(event) => updateProject((draft) => { draft.organization ??= { tags: [], favorite: false, archived: false }; draft.organization.favorite = event.target.checked; })} /> Favoriet</label><label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm"><input type="checkbox" checked={project.organization?.archived ?? false} onChange={(event) => updateProject((draft) => { draft.organization ??= { tags: [], favorite: false, archived: false }; draft.organization.archived = event.target.checked; })} /> Gearchiveerd</label></div></section>

      <section className="mt-6 border-t border-[var(--border)] pt-5"><p className="panel-title">Zoeken en vervangen</p><div className="mt-3 grid gap-2"><input className="input" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Zoeken in alle tekstvelden" /><input className="input" value={replace} onChange={(event) => setReplace(event.target.value)} placeholder="Vervangen door" />{matches.length > 0 && <div className="max-h-36 overflow-auto rounded-xl bg-[var(--surface-soft)] p-2" aria-label="Voorbeeld van zoekresultaten">{matches.slice(0, 8).map((match, index) => <p key={`${match.page}-${match.field}-${index}`} className="truncate py-1 text-xs"><strong>P{match.page} · {match.language.toUpperCase()} · {match.field}</strong> — {match.text}</p>)}{matches.length > 8 && <p className="pt-1 text-xs text-[var(--muted)]">+ {matches.length - 8} meer</p>}</div>}<button className="btn-secondary" disabled={!find || matches.length === 0} onClick={() => { let count = 0; updateProject((draft) => { for (const page of draft.pages) for (const [field, value] of Object.entries(page.fields)) { if (typeof value === "string" && value.includes(find)) { page.fields[field] = value.replaceAll(find, replace); page.contentRevision = (page.contentRevision ?? 0) + 1; count++; } else if (Array.isArray(value) && typeof value[0] === "string") page.fields[field] = (value as string[]).map((item) => { if (!item.includes(find)) return item; count++; return item.replaceAll(find, replace); }); } }); toast.success(`${count} vervanging(en) uitgevoerd`); }}>Bekijk en vervang {matches.length} veld(en)</button></div></section>

      <section className="mt-6 border-t border-[var(--border)] pt-5"><div className="flex items-center justify-between gap-2"><p className="panel-title">Versiegeschiedenis</p><button className="btn-ghost px-3" onClick={() => void db.saveSnapshot(project, "Handmatige snapshot").then(() => db.loadSnapshots(project.id).then(setSnapshots))}>Snapshot maken</button></div>{snapshots.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Nog geen snapshots.</p> : <ul className="mt-3 space-y-2">{snapshots.slice(0, 8).map((snapshot) => <li key={snapshot.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3"><div><p className="text-sm font-semibold">{snapshot.reason}</p><p className="text-xs text-[var(--muted)]">{new Date(snapshot.createdAt).toLocaleString()}</p></div><button className="btn-secondary px-3" onClick={() => { const clone = structuredClone(snapshot.project); const pageIds = new Map<string, string>(); clone.id = newId(); clone.projectMeta.title += " (hersteld)"; clone.createdAt = clone.updatedAt = new Date().toISOString(); for (const page of clone.pages) { const oldId = page.id; page.id = newId(); pageIds.set(oldId, page.id); } for (const record of clone.production?.images ?? []) { const replacement = record.pageId ? pageIds.get(record.pageId) : undefined; if (replacement) record.pageId = replacement; } void createProject(clone); }}>Herstel als kopie</button></li>)}</ul>}</section>
    </div>
  );
}
