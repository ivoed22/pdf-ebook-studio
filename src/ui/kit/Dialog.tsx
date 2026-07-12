import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ title, description, onClose, children, footer, maxWidth = "max-w-2xl" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useRef(`dialog-title-${Math.random().toString(36).slice(2)}`);
  const descriptionId = useRef(`dialog-description-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    requestAnimationFrame(() => first?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!focusable.length) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#160f2b]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descriptionId.current : undefined}
        className={`studio-enter flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[var(--shadow-lg)] sm:rounded-[24px] ${maxWidth}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId.current} className="font-display text-xl font-semibold text-[var(--ink)] sm:text-2xl">{title}</h2>
            {description && <p id={descriptionId.current} className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
          </div>
          <button className="icon-button" aria-label="Sluiten" onClick={onClose}>×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="mobile-safe-bottom flex justify-end gap-2 border-t border-[var(--border)] bg-white px-5 pt-4 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}
