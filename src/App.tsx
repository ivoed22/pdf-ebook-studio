import { lazy, Suspense, useEffect } from "react";
import { useStudio } from "./store/useStudio";
import { useT } from "./i18n/strings";
import { Toaster } from "./ui/kit/Toaster";
import { ConfirmDialogHost } from "./ui/kit/ConfirmDialog";

const Dashboard = lazy(() => import("./ui/Dashboard"));
const EditorScreen = lazy(() => import("./ui/EditorScreen"));

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
      <div className="studio-card flex items-center gap-3 px-5 py-4 text-sm text-[var(--muted)]">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--primary)]" />
        {label}
      </div>
    </div>
  );
}

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
      <a className="sr-only-focusable" href="#main-content">Ga naar hoofdinhoud</a>
      {loading ? <LoadingScreen label={t("loading")} /> : (
        <Suspense fallback={<LoadingScreen label={t("loading")} />}>
          {screen === "dashboard" ? <Dashboard /> : <EditorScreen />}
        </Suspense>
      )}
      <Toaster />
      <ConfirmDialogHost />
    </>
  );
}
