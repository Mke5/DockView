import { useEffect } from "react";
import { destroyDockerBridge, initDockerBridge } from "./backend/bridge";
import Titlebar from "./components/Titlebar";

function App() {
  useEffect(() => {
    initDockerBridge();
    return () => destroyDockerBridge();
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg0)" }}
    >
      <Titlebar />
    </div>
  );
}

export default App;
