/**
 * Robust color swatch: shows the actual color as a div background (native
 * <input type="color"> renders unreliably across browsers), with the picker
 * layered on top so clicking still opens the OS color dialog.
 */
export function ColorField({
  hex,
  onChange,
}: {
  hex: string;
  onChange: (hex: string) => void;
}) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
  return (
    <label
      className="relative h-8 w-8 shrink-0 rounded border border-stone-300 cursor-pointer overflow-hidden block"
      style={{ backgroundColor: valid ? hex : "#ffffff" }}
      title={hex || "—"}
    >
      {!valid && (
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-stone-400">
          ?
        </span>
      )}
      <input
        type="color"
        className="absolute -inset-2 opacity-0 cursor-pointer"
        value={valid ? hex : "#cccccc"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
    </label>
  );
}
