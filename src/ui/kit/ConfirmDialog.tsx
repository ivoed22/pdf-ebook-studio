import { create } from "zustand";
import { useT } from "../../i18n/strings";
import { Dialog } from "./Dialog";

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
    <Dialog
      title={current.title}
      onClose={() => settle(false)}
      maxWidth="max-w-sm"
      footer={
        <>
          <button className="btn-secondary" onClick={() => settle(false)} autoFocus>
            {t("cancel")}
          </button>
          <button
            className={`btn text-white ${current.danger ? "bg-red-600 hover:bg-red-500" : "bg-stone-900 hover:bg-stone-700"}`}
            onClick={() => settle(true)}
          >
            {current.confirmLabel ?? t("confirm")}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[var(--muted)]">{current.message}</p>
    </Dialog>
  );
}
