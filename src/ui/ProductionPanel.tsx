import { useMemo, useState } from "react";
import { useStudio } from "../store/useStudio";
import { imageFilenamesForPage, type ProductionImageRecord, type ProductionImageStatus } from "../types/project";
import { toast } from "./kit/Toaster";
import { Icon } from "./kit/Icon";
import AssetManager from "./AssetManager";
import { imageUrl } from "../core/assets/imageStore";
import { suggestMatch } from "../core/assets/imageStore";
import { confirmDialog } from "./kit/ConfirmDialog";

type Filter = "all" | ProductionImageStatus | "missing" | "wrong-ratio" | "low-res" | "unused";

export default function ProductionPanel() {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const setStatus = useStudio((s) => s.setProductionStatus);
  const updateProject = useStudio((s) => s.updateProject);
  const addImages = useStudio((s) => s.addImages);
  const removeImage = useStudio((s) => s.removeImage);
  const [filter, setFilter] = useState<Filter>("all");
  const plan = project?.production;
  const records = plan?.images ?? [];
  const approved = records.filter((item) => item.status === "approved").length;
  const used = new Set(project?.pages.flatMap(imageFilenamesForPage) ?? []);
  const visible = useMemo(() => records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "missing") return !images.has(record.filename);
    const asset = images.get(record.filename);
    if (filter === "unused") return !used.has(record.filename);
    if (filter === "wrong-ratio") { if (!asset?.width || !asset.height || !record.orientation) return false; const ratio = asset.width / asset.height; return (ratio > 1.08 ? "landscape" : ratio < 0.92 ? "portrait" : "square") !== record.orientation; }
    if (filter === "low-res") { if (!asset?.width || !record.orientation) return false; return asset.width / (record.orientation === "portrait" ? 4.2 : record.orientation === "square" ? 5.5 : 7.2) < 200; }
    return record.status === filter;
  }), [records, filter, images, project]);

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} gekopieerd`);
  }

  return (
    <div>
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div><p className="panel-title">Beeldproductie</p><h2 className="mt-1 font-display text-xl font-semibold">{records.length ? `${approved} van ${records.length} goedgekeurd` : "Geen productieplan"}</h2></div>
          {plan?.sourceMarkdown && <button className="btn-secondary px-3" onClick={() => void copy(plan.sourceMarkdown!, "Batchprompts")}><Icon name="copy" size={16} />Alle batches</button>}
        </div>
        {records.length > 0 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]"><div className="h-full rounded-full bg-[var(--success)] transition-[width]" style={{ width: `${Math.round((approved / records.length) * 100)}%` }} /></div>}
        {(plan?.batches.length ?? 0) > 0 && <div className="mt-3 grid gap-2">{plan!.batches.map((batch) => { const batchRecords = records.filter((record) => record.batchId === batch.id || batch.filenames.includes(record.filename)); const done = batchRecords.filter((record) => record.status === "approved").length; const promptText = batch.promptText || batchRecords.map((record) => `${record.filename}\n${record.prompt}${record.avoid ? `\nAvoid: ${record.avoid}` : ""}`).join("\n\n---\n\n"); return <div key={batch.id} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-[var(--surface-soft)] px-3"><div><p className="text-xs font-semibold">{batch.label}</p><p className="text-xs text-[var(--muted)]">{done}/{batchRecords.length} goedgekeurd</p></div><button className="icon-button" aria-label={`Batch ${batch.label} kopiëren`} onClick={() => void copy(promptText, batch.label)}><Icon name="copy" size={16} /></button></div>; })}</div>}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Beeldfilters">
          {(["all", "missing", "planned", "uploaded", "approved", "rejected", "wrong-ratio", "low-res", "unused"] as Filter[]).map((value) => <button key={value} className={`studio-chip whitespace-nowrap ${filter === value ? "ring-2 ring-[var(--primary)]" : ""}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{filterLabel(value)}</button>)}
        </div>
      </div>
      {records.length > 0 && <ul className="space-y-3 p-4">
        {visible.map((record) => { const suggestion = !images.has(record.filename) ? suggestMatch(record.filename, [...images.keys()]) : undefined; const updateCrop = (values: { cropFocus?: ProductionImageRecord["cropFocus"]; cropZoom?: number }) => updateProject((draft) => { const item = draft.production?.images.find((candidate) => candidate.filename === record.filename); if (item) { Object.assign(item, values); item.updatedAt = new Date().toISOString(); } }); return <ProductionRow key={record.filename} record={record} imageSrc={images.get(record.filename) ? imageUrl(images.get(record.filename)!) : undefined} suggestion={suggestion} onAcceptSuggestion={suggestion ? async () => { const ok = await confirmDialog({ title: "Bijna-overeenkomst gebruiken?", message: `Hernoem “${suggestion}” naar de exact geplande naam “${record.filename}”?`, confirmLabel: "Bevestig koppeling" }); if (!ok) return; const asset = images.get(suggestion); if (asset) { await addImages([{ ...asset, filename: record.filename }]); await removeImage(suggestion); toast.success(`${record.filename} gekoppeld`); } } : undefined} onCopy={() => void copy(record.prompt, record.filename)} onStatus={(status, reason) => setStatus(record.filename, status, reason)} onFocus={(cropFocus) => updateCrop({ cropFocus })} onZoom={(cropZoom) => updateCrop({ cropZoom })} />; })}
      </ul>}
      <div className="border-t border-[var(--border)]"><AssetManager /></div>
    </div>
  );
}

function ProductionRow({ record, imageSrc, suggestion, onAcceptSuggestion, onCopy, onStatus, onFocus, onZoom }: { record: ProductionImageRecord; imageSrc?: string; suggestion?: string; onAcceptSuggestion?: () => void; onCopy: () => void; onStatus: (status: ProductionImageStatus, reason?: string) => void; onFocus: (focus: "center" | "top" | "bottom" | "left" | "right") => void; onZoom: (zoom: number) => void }) {
  const uploaded = Boolean(imageSrc);
  const [reason, setReason] = useState(record.rejectionReason ?? "");
  return <li className="rounded-2xl border border-[var(--border)] bg-white p-3">
    {imageSrc && <div className={`relative mb-3 overflow-hidden rounded-xl bg-[var(--surface-soft)] ${record.orientation === "portrait" ? "aspect-[3/4]" : record.orientation === "square" ? "aspect-square" : "aspect-[3/2]"}`}><img src={imageSrc} alt={`Cropvoorbeeld ${record.filename}`} className="h-full w-full object-cover transition-transform" style={{ objectPosition: focusPosition(record.cropFocus), transform: `scale(${record.cropZoom ?? 1})` }} /><span className="pointer-events-none absolute inset-[8%] rounded-lg border border-dashed border-white/90 shadow-[0_0_0_999px_rgba(20,10,35,.08)]" aria-hidden /></div>}
    <div className="flex items-start gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(record.status)}`} /><div className="min-w-0 flex-1"><p className="truncate font-mono text-xs font-semibold" title={record.filename}>{record.filename}</p><p className="mt-1 text-xs text-[var(--muted)]">{record.language?.toUpperCase() ?? "—"} · {record.templateId ?? "template"} · {record.orientation ?? "formaat onbekend"}{uploaded ? " · geüpload" : " · ontbreekt"}</p></div><button className="icon-button" aria-label={`Prompt voor ${record.filename} kopiëren`} onClick={onCopy}><Icon name="copy" size={16} /></button></div>
    <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">{record.prompt}</p>
    {suggestion && <button className="status-warning mt-3 w-full rounded-xl p-3 text-left text-xs" onClick={onAcceptSuggestion}><strong>Bijna-overeenkomst:</strong> {suggestion}<span className="mt-1 block underline">Controleer en bevestig koppeling</span></button>}
    {imageSrc && <div className="mt-3 flex gap-1" aria-label="Cropfocus">{(["left", "top", "center", "bottom", "right"] as const).map((focus) => <button key={focus} className={`min-h-11 flex-1 rounded-lg border text-xs font-semibold ${record.cropFocus === focus || (!record.cropFocus && focus === "center") ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)]"}`} aria-pressed={record.cropFocus === focus} onClick={() => onFocus(focus)}>{focus.slice(0, 1).toUpperCase()}</button>)}</div>}
    {imageSrc && <label className="mt-3 block text-xs font-semibold">Zoom · {(record.cropZoom ?? 1).toFixed(1)}×<input className="mt-2 w-full accent-[var(--primary)]" type="range" min="1" max="3" step="0.1" value={record.cropZoom ?? 1} onChange={(event) => onZoom(Number(event.target.value))} /></label>}
    {record.status === "rejected" && <div className="status-danger mt-3 rounded-xl p-3"><label className="label">Afkeurreden / opnieuw genereren</label><input className="input" value={reason} onChange={(event) => setReason(event.target.value)} onBlur={() => onStatus("rejected", reason)} placeholder="Wat moet in de volgende generatie anders?" /></div>}
    <div className="mt-3 flex flex-wrap gap-2">{uploaded && record.status !== "approved" && <button className="btn-secondary px-3" onClick={() => onStatus("approved")}><Icon name="check" size={15} />Goedkeuren</button>}{record.status !== "rejected" && <button className="btn-ghost px-3 text-[var(--danger)]" onClick={() => onStatus("rejected", reason || "Opnieuw genereren en controleren")}>Afkeuren</button>}{record.status === "rejected" && <button className="btn-secondary px-3" onClick={() => onStatus(uploaded ? "uploaded" : "planned")}>Terugzetten</button>}</div>
  </li>;
}

function filterLabel(value: Filter) { return ({ all: "Alles", missing: "Ontbrekend", planned: "Gepland", uploaded: "Geüpload", approved: "Goedgekeurd", rejected: "Afgekeurd", "wrong-ratio": "Verkeerde verhouding", "low-res": "Lage resolutie", unused: "Ongebruikt" })[value]; }
function statusColor(status: ProductionImageStatus) { return status === "approved" ? "bg-[var(--success)]" : status === "rejected" ? "bg-[var(--danger)]" : status === "uploaded" ? "bg-[var(--primary)]" : "bg-[var(--warning)]"; }
function focusPosition(focus?: string) { return focus === "top" ? "50% 0%" : focus === "bottom" ? "50% 100%" : focus === "left" ? "0% 50%" : focus === "right" ? "100% 50%" : "50% 50%"; }
