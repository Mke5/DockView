import { useEffect } from "react";
import { destroyDockerBridge, initDockerBridge } from "./backend/bridge";

function App() {
  useEffect(() => {
    initDockerBridge();
    return () => destroyDockerBridge();
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg0)" }}
    ></div>
  );
}

export default App;
