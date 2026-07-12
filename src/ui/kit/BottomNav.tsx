import { Icon } from "./Icon";
import type { MobileMode } from "../../store/useLayout";

const ITEMS: { id: MobileMode; label: string; icon: string }[] = [
  { id: "pages", label: "Pagina's", icon: "pages" },
  { id: "preview", label: "Preview", icon: "page" },
  { id: "edit", label: "Bewerken", icon: "edit" },
  { id: "more", label: "Meer", icon: "more" },
];

export function BottomNav({ value, onChange }: { value: MobileMode; onChange: (mode: MobileMode) => void }) {
  return (
    <nav aria-label="Mobiele editor" className="mobile-safe-bottom grid grid-cols-4 border-t border-[var(--border)] bg-white/95 px-1 pt-1 backdrop-blur-xl lg:hidden">
      {ITEMS.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-xs font-semibold transition-colors ${active ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "text-[var(--muted)]"}`}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon name={item.icon} size={19} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
