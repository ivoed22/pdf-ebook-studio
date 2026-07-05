import { useEffect } from "react";
import { useStudio } from "./store/useStudio";
import { useT } from "./i18n/strings";
import Dashboard from "./ui/Dashboard";
import EditorScreen from "./ui/EditorScreen";
import { Toaster } from "./ui/kit/Toaster";
import { ConfirmDialogHost } from "./ui/kit/ConfirmDialog";

export default function App() {
  const screen = useStudio((s) => s.screen);
  const loading = useStudio((s) => s.loading);
  const init = useStudio((s) => s.init);
  const t = useT();

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <>
      {loading ? (
        <div className="h-full flex items-center justify-center text-stone-400 text-sm">
          {t("loading")}
        </div>
      ) : screen === "dashboard" ? (
        <Dashboard />
      ) : (
        <EditorScreen />
      )}
      <Toaster />
      <ConfirmDialogHost />
    </>
  );
}
