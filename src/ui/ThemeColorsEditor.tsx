import { useStudio } from "../store/useStudio";
import { EDITABLE_THEME_ROLES, getTheme, resolveProjectTheme } from "../data/themes/themes";
import type { EditableThemeRole } from "../data/themes/themes";
import { useT, type StringKey } from "../i18n/strings";
import { ColorField } from "./kit/ColorField";

const ROLE_LABEL: Record<EditableThemeRole, StringKey> = {
  background: "roleBackground",
  surface: "roleSurface",
  text: "roleText",
  heading: "roleHeading",
  accent: "roleAccent",
  divider: "roleDivider",
};

export default function ThemeColorsEditor() {
  const project = useStudio((s) => s.project);
  const updateProject = useStudio((s) => s.updateProject);
  const t = useT();
  if (!project) return null;

  const base = getTheme(project.projectMeta.theme);
  const effective = resolveProjectTheme(project);
  const overrides = project.projectMeta.themeColors ?? {};
  const customized = Object.keys(overrides).length > 0;

  function setRole(role: EditableThemeRole, hex: string) {
    updateProject((p) => {
      const next = { ...(p.projectMeta.themeColors ?? {}) };
      next[role] = hex;
      p.projectMeta.themeColors = next;
    });
  }

  function reset() {
    updateProject((p) => {
      delete p.projectMeta.themeColors;
    });
  }

  return (
    <div className="rounded-md border border-stone-200 p-3 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="panel-title">{t("documentTheme")}</span>
        <div className="flex items-center gap-2">
          {customized && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700">
              {t("themeCustomized")}
            </span>
          )}
          {customized && (
            <button className="text-[11px] text-stone-400 hover:text-stone-700 cursor-pointer" onClick={reset}>
              {t("resetTheme")}
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-stone-400 leading-snug mb-2.5">{t("documentThemeNote")}</p>

      {/* live preview strip */}
      <div className="flex gap-1 mb-3">
        {EDITABLE_THEME_ROLES.map((role) => (
          <span
            key={role}
            className="h-6 flex-1 rounded-sm border border-black/5"
            style={{ backgroundColor: effective.colors[role] }}
            title={`${t(ROLE_LABEL[role])} ${effective.colors[role]}`}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        {EDITABLE_THEME_ROLES.map((role) => {
          const value = (overrides[role] as string) || base.colors[role];
          return (
            <div key={role} className="flex items-center gap-2">
              <ColorField hex={value} onChange={(hex) => setRole(role, hex)} />
              <span className="text-xs text-stone-600 flex-1 min-w-0">{t(ROLE_LABEL[role])}</span>
              <input
                className="input w-24 shrink-0 font-mono text-xs"
                value={value}
                onChange={(e) => setRole(role, e.target.value.toUpperCase())}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
