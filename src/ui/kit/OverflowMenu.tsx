import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export function OverflowMenu({ label, children, align = "top" }: { label: string; children: ReactNode; align?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close(restore = true) { setOpen(false); if (restore) queueMicrotask(() => trigger.current?.focus()); }
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return <div ref={root} className="relative shrink-0"><button ref={trigger} className="icon-button" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}><Icon name="more" size={18} /></button>{open && <div role="menu" className={`absolute right-0 z-30 min-w-48 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-xl ${align === "top" ? "bottom-12" : "top-12"}`} onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button")) close(); }}>{children}</div>}</div>;
}
