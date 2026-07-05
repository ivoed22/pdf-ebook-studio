import { useT } from "../i18n/strings";

export default function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const t = useT();
  const rows: [string, string][] = [
    ["Ctrl+Z / Ctrl+Shift+Z", t("scUndo")],
    ["PgUp / PgDn", t("scNav")],
    ["Ctrl+D", t("scDup")],
    ["?", t("scHelp")],
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">{t("shortcuts")}</h2>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([keys, label]) => (
              <tr key={keys} className="border-b border-stone-100 last:border-0">
                <td className="py-2 pr-3">
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-700">
                    {keys}
                  </code>
                </td>
                <td className="py-2 text-stone-600">{label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
