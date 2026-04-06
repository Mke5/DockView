import { useEffect } from "react";
import { destroyDockerBridge, initDockerBridge } from "./backend/bridge";
import Titlebar from "./components/Titlebar";
import StatusBar from "./components/Statusbar";
import Sidebar from "./components/Sidebar";

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
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
