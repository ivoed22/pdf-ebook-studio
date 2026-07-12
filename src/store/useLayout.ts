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
  setMobileMode(mode: MobileMode): void;
  setWorkSection(section: WorkSection): void;
  setPagePanelOpen(open: boolean): void;
  setInspectorOpen(open: boolean): void;
  setPagePanelWidth(width: number): void;
  setInspectorWidth(width: number): void;
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
      setMobileMode: (mobileMode) => set({ mobileMode }),
      setWorkSection: (workSection) => set({ workSection }),
      setPagePanelOpen: (pagePanelOpen) => set({ pagePanelOpen }),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      setPagePanelWidth: (pagePanelWidth) => set({ pagePanelWidth }),
      setInspectorWidth: (inspectorWidth) => set({ inspectorWidth }),
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
      }),
    },
  ),
);
