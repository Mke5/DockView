import { useAppStore } from "../store/";
import ContainersView from "./views/ContainersView";
import ImagesView from "./views/ImagesView";
import NetworksView from "./views/NetworksView";
import PlaceholderView from "./views/PlaceholderView";
import VolumesView from "./views/VolumesView";

export default function MainContent() {
  const { activeView } = useAppStore();

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{ background: "var(--bg0)" }}
    >
      {renderView(activeView)}
    </div>
  );
}

function renderView(view: string) {
  switch (view) {
    case "containers":
      return <ContainersView />;
    case "images":
      return <ImagesView />;
    case "volumes":
      return <VolumesView />;
    case "networks":
      return <NetworksView />;
    case "compose":
      return <PlaceholderView title="Compose" />;
    case "builds":
      return <PlaceholderView title="Builds" />;
    case "registry":
      return <PlaceholderView title="Registry" />;
    case "logs":
      return <PlaceholderView title="logs" />;
    case "terminal":
      return <PlaceholderView title="terminal" />;
    case "settings":
      return <PlaceholderView title="settings" />;
    default:
      return <PlaceholderView title="defult view" />;
  }
}
