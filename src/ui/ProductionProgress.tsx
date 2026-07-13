import type { Project } from "../types/project";
import { projectProgress } from "../core/production/progress";
import { Icon } from "./kit/Icon";

export function ProductionProgress({ project, errors, onSelect, compact = false }: { project: Project; errors?: number; onSelect?: (id: "content" | "images" | "qc" | "export") => void; compact?: boolean }) {
  const steps = projectProgress(project, errors);
  return <nav aria-label="Productievoortgang" className={compact ? "grid grid-cols-4 gap-1" : "grid grid-cols-2 gap-2 lg:grid-cols-4"}>{steps.map((step) => {
    const content = <><span className="flex items-center gap-1.5 text-xs font-bold"><Icon name={step.state === "done" ? "check" : step.id === "images" ? "image" : step.id === "qc" ? "shield" : step.id === "export" ? "export" : "edit"} size={14} />{step.label}</span>{!compact && <span className="mt-0.5 block text-xs opacity-80">{step.detail}</span>}</>;
    const classes = `min-h-11 rounded-xl border px-2 py-2 text-left ${stateClass(step.state)}`;
    return onSelect ? <button key={step.id} type="button" onClick={() => onSelect(step.id)} className={classes}>{content}</button> : <div key={step.id} className={classes}>{content}</div>;
  })}</nav>;
}

function stateClass(state: string) { return state === "done" ? "status-success border-transparent" : state === "attention" ? "status-danger border-transparent" : state === "in-progress" ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "border-[var(--border)] bg-white text-[var(--muted)]"; }
