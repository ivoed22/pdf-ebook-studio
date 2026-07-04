import { useEffect } from "react";
import { useStudio } from "./store/useStudio";
import Dashboard from "./ui/Dashboard";
import EditorScreen from "./ui/EditorScreen";

export default function App() {
  const screen = useStudio((s) => s.screen);
  const loading = useStudio((s) => s.loading);
  const init = useStudio((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-stone-400 text-sm">
        Loading your studio…
      </div>
    );
  }
  return screen === "dashboard" ? <Dashboard /> : <EditorScreen />;
}
