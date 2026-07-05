import { useI18n } from "../../i18n/strings";

export function LangToggle() {
  const uiLang = useI18n((s) => s.uiLang);
  const setUiLang = useI18n((s) => s.setUiLang);
  return (
    <div className="flex rounded-md border border-stone-300 overflow-hidden" title="App language">
      {(["nl", "en"] as const).map((lang) => (
        <button
          key={lang}
          className={`px-2.5 py-1 text-[11px] font-bold uppercase cursor-pointer transition-colors ${
            uiLang === lang ? "bg-stone-900 text-white" : "bg-white text-stone-400 hover:text-stone-700"
          }`}
          onClick={() => setUiLang(lang)}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
