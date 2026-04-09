import { FileText, Pause, Play, Square, Terminal, Trash2 } from "lucide-react";
import { RowBtn } from "../RowBtn";
import { Cell } from "../Cell";
import { Container } from "../../store";
import StatusBadge from "../StatusBadge";

export function ContainerRow({
  container: c,
  selected,
  onSelect,
  onRemove,
  onToggle,
}: {
  container: Container;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const cpuColor =
    c.cpu > 60 ? "var(--red)" : c.cpu > 30 ? "var(--amber)" : "var(--green)";
  const rowBg = selected ? "var(--accent-dim)" : "var(--bg1)";
  const rowBorder = selected ? "rgba(0,212,255,0.25)" : "var(--border)";

  return (
    <tr
      onClick={onSelect}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => {
        if (!selected)
          Array.from(e.currentTarget.cells).forEach((td) => {
            td.style.background = "var(--bg2)";
            td.style.borderTopColor = "var(--border-lit)";
            td.style.borderBottomColor = "var(--border-lit)";
          });
      }}
      onMouseLeave={(e) => {
        if (!selected)
          Array.from(e.currentTarget.cells).forEach((td) => {
            td.style.background = rowBg;
            td.style.borderTopColor = rowBorder;
            td.style.borderBottomColor = rowBorder;
          });
      }}
    >
      <Cell
        first
        style={{ background: rowBg, borderColor: rowBorder, width: "28%" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-sm shrink-0"
            style={{
              background:
                c.status === "running"
                  ? "var(--green-dim)"
                  : c.status === "paused"
                    ? "var(--amber-dim)"
                    : "var(--bg4)",
            }}
          >
            {c.status === "running" ? (
              <Play className="w-3 h-3" />
            ) : c.status === "paused" ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </div>
          <div>
            <div
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {c.name}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {c.image}
            </div>
          </div>
        </div>
      </Cell>
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <StatusBadge status={c.status} />
      </Cell>
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "13%" }}>
        <div className="flex flex-wrap gap-0.5">
          {c.ports.length > 0 ? (
            c.ports.map((p) => (
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
      </Cell>
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}>
        <div className="flex items-center gap-1.5">
          <div
            className="w-10 h-1 rounded-full overflow-hidden shrink-0"
            style={{ background: "var(--bg4)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${c.cpu}%`, background: cpuColor }}
            />
          </div>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-secondary)" }}
          >
            {c.cpu}%
          </span>
        </div>
      </Cell>
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "9%" }}>
        <span
          className="text-[11px] font-mono"
          style={{ color: "var(--text-secondary)" }}
        >
          {c.memory}
        </span>
      </Cell>
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {c.shortId}
        </span>
      </Cell>
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <span
          className="text-[10px] font-mono whitespace-nowrap"
          style={{ color: "var(--text-muted)" }}
        >
          {c.uptime}
        </span>
      </Cell>
      <Cell
        last
        style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}
        className="group"
      >
        <div className="flex items-center gap-0.5 transition-opacity duration-150">
          <RowBtn title="Logs">
            <FileText className="w-3 h-3" />
          </RowBtn>
          <RowBtn title="Terminal">
            <Terminal className="w-3 h-3" />
          </RowBtn>
          <RowBtn
            title={c.status === "running" ? "Stop" : "Start"}
            onClick={onToggle}
          >
            {c.status === "running" ? (
              <Square className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </RowBtn>
          <RowBtn title="Remove" danger onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </RowBtn>
        </div>
      </Cell>
    </tr>
  );
}
