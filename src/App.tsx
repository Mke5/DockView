import { useEffect } from "react";

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
