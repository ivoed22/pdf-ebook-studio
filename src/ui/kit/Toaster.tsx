import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push(kind: ToastKind, message: string): void;
  dismiss(id: number): void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push(kind, message) {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, kind, message }] });
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
};

const KIND_STYLE: Record<ToastKind, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-stone-300 bg-white text-stone-700",
};

const KIND_DOT: Record<ToastKind, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-stone-400",
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg text-left cursor-pointer animate-[toast-in_.2s_ease-out] ${KIND_STYLE[t.kind]}`}
          onClick={() => dismiss(t.id)}
        >
          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${KIND_DOT[t.kind]}`} />
          <span className="leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
