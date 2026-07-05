import { create } from "zustand";
import { useT } from "../../i18n/strings";

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve(ok: boolean): void;
}

interface ConfirmState {
  current: ConfirmRequest | null;
  open(req: ConfirmRequest): void;
  settle(ok: boolean): void;
}

const useConfirm = create<ConfirmState>((set, get) => ({
  current: null,
  open(req) {
    set({ current: req });
  },
  settle(ok) {
    get().current?.resolve(ok);
    set({ current: null });
  },
}));

/** Promise-based replacement for window.confirm(). */
export function confirmDialog(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirm.getState().open({ ...options, resolve });
  });
}

export function ConfirmDialogHost() {
  const current = useConfirm((s) => s.current);
  const settle = useConfirm((s) => s.settle);
  const t = useT();
  if (!current) return null;
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4"
      onClick={() => settle(false)}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-stone-900">{current.title}</h3>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">{current.message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => settle(false)} autoFocus>
            {t("cancel")}
          </button>
          <button
            className={`btn text-white ${current.danger ? "bg-red-600 hover:bg-red-500" : "bg-stone-900 hover:bg-stone-700"}`}
            onClick={() => settle(true)}
          >
            {current.confirmLabel ?? t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
