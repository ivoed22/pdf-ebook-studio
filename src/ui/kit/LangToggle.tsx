import { useI18n } from "../../i18n/strings";

export function LangToggle() {
  const uiLang = useI18n((s) => s.uiLang);
  const setUiLang = useI18n((s) => s.setUiLang);
  return (
    <div className="flex rounded-xl border border-[var(--border)] overflow-hidden" role="group" aria-label="App language">
      {(["nl", "en"] as const).map((lang) => (
        <button
          key={lang}
          className={`min-h-11 min-w-11 px-3 text-xs font-bold uppercase cursor-pointer transition-colors ${
            uiLang === lang ? "bg-[var(--surface-strong)] text-white" : "bg-white text-[var(--muted)] hover:bg-[var(--primary-soft)]"
          }`}
          aria-pressed={uiLang === lang}
          aria-label={lang === "nl" ? "Nederlands" : "English"}
          onClick={() => setUiLang(lang)}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
