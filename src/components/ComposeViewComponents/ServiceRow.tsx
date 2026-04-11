import { FileText, Pause, Play, Terminal } from "lucide-react";
import { ComposeService } from "../../store";
import { SERVICE_STATUS_CFG, StackBtn } from "./StackCard";

export function ServiceRow({
  service: svc,
  last,
  onToggle,
}: {
  service: ComposeService;
  last: boolean;
  onToggle: () => void;
}) {
  const cfg = SERVICE_STATUS_CFG[svc.status] ?? SERVICE_STATUS_CFG.stopped;
  const cpuColor =
    svc.cpu > 60
      ? "var(--red)"
      : svc.cpu > 30
        ? "var(--amber)"
        : "var(--green)";

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 group"
      style={{
        background: "transparent",
        borderBottom: !last ? "1px solid var(--border)" : "none",
        paddingLeft: "52px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div className="flex items-center gap-2 w-36 shrink-0">
        <span className="text-[11px] shrink-0" style={{ color: cfg.color }}>
          {cfg.icon}
        </span>
        <span
          className="text-[11px] font-mono font-medium truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {svc.name}
        </span>
      </div>
      <span
        className="text-[10px] font-mono w-40 truncate shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        {svc.image}
      </span>
      <div className="flex items-center gap-1 w-16 shrink-0">
        <div className="flex gap-0.5">
          {Array.from({ length: svc.replicas }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-sm"
              style={{
                background: i < svc.running ? "var(--green)" : "var(--bg4)",
              }}
            />
          ))}
        </div>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {svc.running}/{svc.replicas}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 flex-1">
        {svc.ports.length > 0 ? (
          svc.ports.map((p) => (
            <span key={p} className="port-tag">
              {p}
            </span>
          ))
        ) : (
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            —
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        <div
          className="w-10 h-1 rounded-full overflow-hidden"
          style={{ background: "var(--bg4)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${svc.cpu}%`, background: cpuColor }}
          />
        </div>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {svc.cpu}%
        </span>
      </div>
      <span
        className="text-[10px] font-mono w-20 shrink-0 text-right"
        style={{ color: "var(--text-muted)" }}
      >
        {svc.memory}
      </span>
      <span
        className="text-[10px] font-mono w-20 shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        {svc.containerId}
      </span>
      <div className="flex items-center gap-0.5 shrink-0 transition-opacity">
        <StackBtn title="Logs" small>
          <FileText className="w-3 h-3" />
        </StackBtn>
        <StackBtn title="Terminal" small>
          <Terminal className="w-3 h-3" />
        </StackBtn>
        <StackBtn
          title={svc.status === "running" ? "Stop service" : "Start service"}
          small
          onClick={onToggle}
        >
          {svc.status === "running" ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </StackBtn>
      </div>
    </div>
  );
}
