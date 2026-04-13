import {
  Check,
  Circle,
  Cog,
  Globe,
  Hand,
  Layout,
  Loader,
  Menu,
  RotateCw,
  Square,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { BuildRecord, BuildStatus } from "../../store";
import { Cell } from "../Cell";
import { RowBtn } from "../RowBtn";
import React from "react";

const BUILD_STATUS_CFG: Record<
  BuildStatus,
  { bg: string; color: string; dot: string; label: string; animate: boolean }
> = {
  success: {
    bg: "var(--green-dim)",
    color: "var(--green)",
    dot: "var(--green)",
    label: "Success",
    animate: false,
  },
  failed: {
    bg: "var(--red-dim)",
    color: "var(--red)",
    dot: "var(--red)",
    label: "Failed",
    animate: false,
  },
  building: {
    bg: "var(--accent-dim)",
    color: "var(--accent)",
    dot: "var(--accent)",
    label: "Building",
    animate: true,
  },
  cancelled: {
    bg: "var(--bg4)",
    color: "var(--text-muted)",
    dot: "var(--text-muted)",
    label: "Cancelled",
    animate: false,
  },
  cached: {
    bg: "var(--purple-dim)",
    color: "var(--purple)",
    dot: "var(--purple)",
    label: "Cached",
    animate: false,
  },
};

const STEP_STATUS_CFG: Record<
  string,
  { color: string; icon: React.ReactNode }
> = {
  done: { color: "var(--green)", icon: <Check size={16} /> },
  running: {
    color: "var(--accent)",
    icon: <Loader size={16} className="animate-spin" />,
  },
  error: { color: "var(--red)", icon: <X size={16} /> },
  pending: { color: "var(--text-muted)", icon: <Circle size={16} /> },
  cached: { color: "var(--purple)", icon: <Zap size={16} /> },
};

const TRIGGER_CFG: Record<string, { icon: React.ReactNode; label: string }> = {
  manual: { icon: <Hand size={16} />, label: "Manual" },
  compose: { icon: <Layout size={16} />, label: "Compose" },
  cli: { icon: <Terminal size={16} />, label: "CLI" },
  api: { icon: <Globe size={16} />, label: "API" },
};

function durationBar(ms: number) {
  return Math.min((ms / 150_000) * 100, 100);
}

export function BuildRow({
  build: b,
  selected,
  onSelect,
  onClear,
  onRebuild,
  onCancel,
}: {
  build: BuildRecord;
  selected: boolean;
  onSelect: () => void;
  onClear: () => void;
  onRebuild: () => void;
  onCancel: () => void;
}) {
  const cfg = BUILD_STATUS_CFG[b.status];
  const trigCfg = TRIGGER_CFG[b.trigger] ?? TRIGGER_CFG.manual;
  const rowBg = selected ? "var(--accent-dim)" : "var(--bg1)";
  const rowBorder = selected ? "rgba(0,212,255,0.25)" : "var(--border)";
  const doneSteps = b.steps.filter(
    (s) => s.status === "done" || s.status === "cached",
  ).length;
  const errorSteps = b.steps.filter((s) => s.status === "error").length;

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
      {/* Image */}
      <Cell
        first
        style={{ background: rowBg, borderColor: rowBorder, width: "22%" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0"
            style={{ background: `${cfg.color}15`, color: cfg.color }}
          >
            {b.status === "building" ? (
              <Cog size={16} />
            ) : b.status === "failed" ? (
              <X size={16} />
            ) : b.status === "success" ? (
              <Check size={16} />
            ) : (
              <Circle size={16} />
            )}
          </div>
          <div className="min-w-0">
            <div
              className="text-xs font-semibold font-mono truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {b.image}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {b.shortId} · {b.platform}
            </div>
          </div>
        </div>
      </Cell>

      {/* Status */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "11%" }}>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: cfg.dot,
              boxShadow: cfg.animate ? `0 0 4px ${cfg.dot}` : "none",
              animation: cfg.animate ? "pulseGreen 1.5s infinite" : "none",
            }}
          />
          {cfg.label}
        </span>
      </Cell>

      {/* Trigger */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {trigCfg.icon}
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-secondary)" }}
          >
            {trigCfg.label}
          </span>
        </div>
      </Cell>

      {/* Steps */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "12%" }}>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {b.steps.map((step) => (
              <div
                key={step.id}
                className="w-2 h-2 rounded-sm"
                style={{
                  background:
                    STEP_STATUS_CFG[step.status]?.color ?? "var(--text-muted)",
                }}
                title={`${step.name}: ${step.status}`}
              />
            ))}
          </div>
          <span
            className="text-[10px] font-mono"
            style={{
              color: errorSteps > 0 ? "var(--red)" : "var(--text-muted)",
            }}
          >
            {errorSteps > 0
              ? `${errorSteps} err`
              : `${doneSteps}/${b.steps.length}`}
          </span>
        </div>
      </Cell>

      {/* Duration */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <div className="flex items-center gap-1.5">
          <div
            className="w-10 h-1 rounded-full overflow-hidden shrink-0"
            style={{ background: "var(--bg4)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${durationBar(b.durationMs)}%`,
                background: "var(--accent)",
              }}
            />
          </div>
          <span
            className="text-[10px] font-mono whitespace-nowrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {b.duration || "…"}
          </span>
        </div>
      </Cell>

      {/* Size */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}>
        <span
          className="text-[10px] font-mono"
          style={{
            color:
              b.size === "—" ? "var(--text-muted)" : "var(--text-secondary)",
          }}
        >
          {b.size}
        </span>
      </Cell>

      {/* Started */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "14%" }}>
        <span
          className="text-[10px] font-mono whitespace-nowrap"
          style={{ color: "var(--text-muted)" }}
        >
          {b.startedAt}
        </span>
      </Cell>

      {/* Actions */}
      <Cell
        last
        style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}
      >
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <RowBtn title="View logs" onClick={onSelect}>
            <Menu size={14} />
          </RowBtn>
          {b.status === "building" ? (
            <RowBtn title="Cancel build" danger onClick={onCancel}>
              <Square size={14} />
            </RowBtn>
          ) : (
            <RowBtn title="Rebuild" onClick={onRebuild}>
              <RotateCw size={14} />
            </RowBtn>
          )}
          <RowBtn title="Clear" danger onClick={onClear}>
            <X size={14} />
          </RowBtn>
        </div>
      </Cell>
    </tr>
  );
}
