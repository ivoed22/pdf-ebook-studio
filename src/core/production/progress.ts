import type { Project } from "../../types/project";

export type StepState = "not-started" | "in-progress" | "attention" | "done";
export interface ProductionStep { id: "content" | "images" | "qc" | "export"; label: string; state: StepState; detail: string }

export function projectProgress(project: Project, errorCount = 0): ProductionStep[] {
  const planned = project.production?.images.length ?? 0;
  const approved = project.production?.images.filter((item) => item.status === "approved").length ?? 0;
  const contentDone = project.pages.length > 0 && project.pages.every((page) => typeof page.fields.title === "string" && page.fields.title.trim());
  return [
    { id: "content", label: "Content", state: !project.pages.length ? "not-started" : contentDone ? "done" : "in-progress", detail: `${project.pages.length} pagina's` },
    { id: "images", label: "Afbeeldingen", state: !planned ? "not-started" : approved === planned ? "done" : "in-progress", detail: `${approved}/${planned} goedgekeurd` },
    { id: "qc", label: "QC", state: errorCount ? "attention" : contentDone && (!planned || approved === planned) ? "done" : "not-started", detail: errorCount ? `${errorCount} fouten` : "Geen fouten" },
    { id: "export", label: "Export", state: errorCount ? "attention" : "not-started", detail: errorCount ? "Geblokkeerd" : "Gereed voor preflight" },
  ];
}
