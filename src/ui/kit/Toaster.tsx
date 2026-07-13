import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: Toast[];
  push(kind: ToastKind, message: string, actionLabel?: string, onAction?: () => void): void;
  dismiss(id: number): void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push(kind, message, actionLabel, onAction) {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, kind, message, actionLabel, onAction }] });
    setTimeout(() => get().dismiss(id), kind === "error" ? 7000 : 4000);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  success: (message: string) => useToasts.getState().push("success", message),
  error: (message: string) => useToasts.getState().push("error", message),
  info: (message: string) => useToasts.getState().push("info", message),
  undo: (message: string, action: () => void) => useToasts.getState().push("info", message, "Ongedaan maken", action),
};

const KIND_STYLE: Record<ToastKind, string> = {
  success: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--ink)]",
  error: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--ink)]",
  info: "border-[var(--border)] bg-white text-[var(--ink)]",
};

const KIND_DOT: Record<ToastKind, string> = {
  success: "bg-[var(--success)]",
  error: "bg-[var(--danger)]",
  info: "bg-[var(--primary)]",
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="fixed bottom-20 right-4 z-[100] flex max-w-[calc(100vw-2rem)] flex-col gap-2 lg:bottom-4" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex min-h-11 items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm shadow-lg text-left cursor-pointer animate-[toast-in_.2s_ease-out] ${KIND_STYLE[t.kind]}`}
        >
          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${KIND_DOT[t.kind]}`} />
          <span className="leading-snug">{t.message}</span>
          {t.onAction && <button className="ml-auto min-h-8 shrink-0 rounded-lg px-2 font-semibold underline" onClick={() => { t.onAction?.(); dismiss(t.id); }}>{t.actionLabel}</button>}
          <button className="ml-auto min-h-8 min-w-8 shrink-0 rounded-lg" aria-label="Melding sluiten" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
