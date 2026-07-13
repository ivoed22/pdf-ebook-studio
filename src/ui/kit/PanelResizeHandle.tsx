import { useRef } from "react";

export function PanelResizeHandle({ side, value, min, max, onChange }: { side: "left" | "right"; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const start = useRef({ x: 0, value });
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return <div
    role="separator"
    aria-label={side === "left" ? "Breedte paginapaneel" : "Breedte eigenschappenpaneel"}
    aria-orientation="vertical"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={Math.round(value)}
    tabIndex={0}
    className={"group absolute inset-y-0 z-20 w-3 cursor-col-resize " + (side === "left" ? "-right-1.5" : "-left-1.5")}
    onPointerDown={(event) => {
      start.current = { x: event.clientX, value };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      const delta = event.clientX - start.current.x;
      onChange(clamp(start.current.value + (side === "left" ? delta : -delta)));
    }}
    onKeyDown={(event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      onChange(clamp(value + direction * (side === "left" ? 16 : -16)));
    }}
    onDoubleClick={() => onChange(side === "left" ? 272 : 432)}
  ><span className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--primary)] group-focus:bg-[var(--primary)]" /></div>;
}
