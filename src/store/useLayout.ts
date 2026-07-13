import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MobileMode = "pages" | "preview" | "edit" | "more";
export type WorkSection = "content" | "media" | "style" | "qc" | "export" | "project";

interface LayoutState {
  mobileMode: MobileMode;
  workSection: WorkSection;
  pagePanelOpen: boolean;
  inspectorOpen: boolean;
  pagePanelWidth: number;
  inspectorWidth: number;
  previewZoom: number;
  previewGrid: boolean;
  mobileScroll: Record<MobileMode, number>;
  setMobileMode(mode: MobileMode): void;
  setWorkSection(section: WorkSection): void;
  setPagePanelOpen(open: boolean): void;
  setInspectorOpen(open: boolean): void;
  setPagePanelWidth(width: number): void;
  setInspectorWidth(width: number): void;
  setPreviewZoom(zoom: number): void;
  setPreviewGrid(grid: boolean): void;
  setMobileScroll(mode: MobileMode, top: number): void;
}

export const useLayout = create<LayoutState>()(
  persist(
    (set) => ({
      mobileMode: "preview",
      workSection: "content",
      pagePanelOpen: true,
      inspectorOpen: true,
      pagePanelWidth: 272,
      inspectorWidth: 432,
      previewZoom: 1,
      previewGrid: false,
      mobileScroll: { pages: 0, preview: 0, edit: 0, more: 0 },
      setMobileMode: (mobileMode) => set({ mobileMode }),
      setWorkSection: (workSection) => set({ workSection }),
      setPagePanelOpen: (pagePanelOpen) => set({ pagePanelOpen }),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      setPagePanelWidth: (pagePanelWidth) => set({ pagePanelWidth }),
      setInspectorWidth: (inspectorWidth) => set({ inspectorWidth }),
      setPreviewZoom: (previewZoom) => set({ previewZoom }),
      setPreviewGrid: (previewGrid) => set({ previewGrid }),
      setMobileScroll: (mode, top) => set((state) => ({ mobileScroll: { ...state.mobileScroll, [mode]: top } })),
    }),
    {
      name: "pdf-ebook-studio-layout-v1",
      partialize: (state) => ({
        mobileMode: state.mobileMode,
        workSection: state.workSection,
        pagePanelOpen: state.pagePanelOpen,
        inspectorOpen: state.inspectorOpen,
        pagePanelWidth: state.pagePanelWidth,
        inspectorWidth: state.inspectorWidth,
        previewZoom: state.previewZoom,
        previewGrid: state.previewGrid,
        mobileScroll: state.mobileScroll,
      }),
    },
  ),
);
