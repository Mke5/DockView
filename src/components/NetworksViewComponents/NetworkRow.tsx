import { Info, Link, Network as NetworkIcon, X } from "lucide-react";
import { Network } from "../../store";
import { Cell } from "../Cell";
import { RowBtn } from "../RowBtn";

const DRIVER_COLOR: Record<string, { bg: string; color: string }> = {
  bridge: { bg: "rgba(0,212,255,0.12)", color: "#00d4ff" },
  host: { bg: "rgba(0,230,118,0.12)", color: "#00e676" },
  null: { bg: "var(--bg4)", color: "var(--text-muted)" },
  overlay: { bg: "rgba(179,136,255,0.12)", color: "#b388ff" },
  macvlan: { bg: "rgba(255,171,64,0.12)", color: "#ffab40" },
  none: { bg: "var(--bg4)", color: "var(--text-muted)" },
};

export function driverColor(driver: string) {
  return (
    DRIVER_COLOR[driver.toLowerCase()] ?? {
      bg: "var(--bg3)",
      color: "var(--text-secondary)",
    }
  );
}

export function NetworkRow({
  network: n,
  selected,
  onSelect,
  onRemove,
  onConnect,
}: {
  network: Network;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onConnect: () => void;
}) {
  const dc = driverColor(n.driver);
  const rowBg = selected ? "var(--accent-dim)" : "var(--bg1)";
  const rowBorder = selected ? "rgba(0,212,255,0.25)" : "var(--border)";

  return (
    <tr
      className="group"
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
      {/* Name */}
      <Cell
        first
        style={{ background: rowBg, borderColor: rowBorder, width: "20%" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: dc.bg, color: dc.color }}
          >
            <NetworkIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-semibold font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {n.name}
              </span>
              {n.isDefault && (
                <span
                  className="text-[9px] font-mono px-1 py-px rounded"
                  style={{
                    background: "var(--bg4)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  default
                </span>
              )}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {n.shortId}
            </div>
          </div>
        </div>
      </Cell>

      {/* Driver */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "9%" }}>
        <span
          className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium"
          style={{
            background: dc.bg,
            color: dc.color,
            border: `1px solid ${dc.color}22`,
          }}
        >
          {n.driver}
        </span>
      </Cell>

      {/* Subnet */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "14%" }}>
        <span
          className="text-[11px] font-mono"
          style={{
            color:
              n.subnet === "—" ? "var(--text-muted)" : "var(--text-secondary)",
          }}
        >
          {n.subnet}
        </span>
      </Cell>

      {/* Gateway */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "13%" }}>
        <span
          className="text-[11px] font-mono"
          style={{
            color:
              n.gateway === "—" ? "var(--text-muted)" : "var(--text-secondary)",
          }}
        >
          {n.gateway}
        </span>
      </Cell>

      {/* Scope */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {n.scope}
        </span>
      </Cell>

      {/* Flags */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "14%" }}>
        <div className="flex flex-wrap gap-1">
          {n.internal && <Flag color="var(--purple)">internal</Flag>}
          {n.attachable && <Flag color="var(--accent)">attachable</Flag>}
          {!n.internal && !n.attachable && (
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              —
            </span>
          )}
        </div>
      </Cell>

      {/* Containers */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "12%" }}>
        {n.containers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {n.containers.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold font-mono border"
                  style={{
                    background: "var(--green-dim)",
                    color: "var(--green)",
                    borderColor: "var(--bg1)",
                    zIndex: 3 - i,
                  }}
                  title={c.name}
                >
                  {c.name[0].toUpperCase()}
                </div>
              ))}
              {n.containers.length > 3 && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold font-mono border"
                  style={{
                    background: "var(--bg4)",
                    color: "var(--text-muted)",
                    borderColor: "var(--bg1)",
                  }}
                >
                  +{n.containers.length - 3}
                </div>
              )}
            </div>
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {n.containers.length}
            </span>
          </div>
        ) : (
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            —
          </span>
        )}
      </Cell>

      {/* Actions */}
      <Cell
        last
        style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}
      >
        <div className="flex items-center gap-1 transition-opacity duration-150">
          <RowBtn title="Connect container" onClick={onConnect}>
            <Link className="w-4 h-4" />
          </RowBtn>
          <RowBtn title="Inspect" onClick={onSelect}>
            <Info className="w-4 h-4" />
          </RowBtn>
          <RowBtn
            title={
              n.isDefault ? "Default networks cannot be removed" : "Remove"
            }
            danger
            disabled={n.isDefault}
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </RowBtn>
        </div>
      </Cell>
    </tr>
  );
}

// SHARED COMPONENTS

export function Flag({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-block text-[9px] font-mono font-semibold px-1.5 py-px rounded uppercase tracking-wide"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {children}
    </span>
  );
}

export function ViewToggle({
  children,
  active,
  onClick,
  last,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-all duration-150"
      style={{
        background: active ? "var(--accent-dim)" : "var(--bg2)",
        color: active ? "var(--accent)" : "var(--text-muted)",
        borderRight: !last ? "1px solid var(--border)" : "none",
        border: "none",
      }}
    >
      {children}
    </button>
  );
}
