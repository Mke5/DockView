import { useAppStore } from "../store/";
import ContainersView from "./views/ContainersView";
import ImagesView from "./views/ImagesView";
import PlaceholderView from "./views/PlaceholderView";

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
      return <PlaceholderView title="Volumes" />;
    case "networks":
      return <PlaceholderView title="Networks" />;
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
