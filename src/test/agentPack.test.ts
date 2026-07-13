import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { importAgentPack } from "../core/import/agentPack";
import { createEmptyProject } from "../types/project";

describe("Agent Pack production import", () => {
  it("imports machine-readable image prompts", async () => {
    const project = createEmptyProject({ title: "Pack", productType: "general-ebook", theme: "warm-editorial", languageVersions: ["nl"] });
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify({ format: "pdf-ebook-studio-agent-pack", primaryImport: "project/project.json", qcStatus: "needs-images" }));
    zip.file("project/project.json", JSON.stringify({ format: "pdf-ebook-studio-project", version: 2, project }));
    zip.file("prompts/image-prompts.json", JSON.stringify({ images: [{ filename: "page-01.jpg", prompt: "Editorial image", status: "planned", batchId: "batch-1", updatedAt: new Date().toISOString() }], batches: [{ id: "batch-1", label: "Cover batch", filenames: ["page-01.jpg"] }] }));
    const blob = await zip.generateAsync({ type: "blob" });
    const result = await importAgentPack(new File([blob], "pack.zip", { type: "application/zip" }));
    expect(result.project.production?.images[0].filename).toBe("page-01.jpg");
    expect(result.manifest.qcStatus).toBe("needs-images");
    expect(result.productionPlan?.batches[0].label).toBe("Cover batch");
  });
});
