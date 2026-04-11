import {
  ChevronRight,
  DownloadCloud,
  Info,
  Layers,
  Pause,
  Pencil,
  Play,
  RefreshCcw,
  SquareStop,
  X,
} from "lucide-react";
import { ComposeService, ComposeStack, ComposeStackStatus } from "../../store";
import { ServiceRow } from "./ServiceRow";

export const STACK_STATUS_CFG: Record<
  ComposeStackStatus,
  { bg: string; color: string; dot: string; label: string }
> = {
  running: {
    bg: "var(--green-dim)",
    color: "var(--green)",
    dot: "var(--green)",
    label: "Running",
  },
  partial: {
    bg: "var(--amber-dim)",
    color: "var(--amber)",
    dot: "var(--amber)",
    label: "Partial",
  },
  stopped: {
    bg: "var(--bg4)",
    color: "var(--text-muted)",
    dot: "var(--text-muted)",
    label: "Stopped",
  },
  degraded: {
    bg: "var(--red-dim)",
    color: "var(--red)",
    dot: "var(--red)",
    label: "Degraded",
  },
};

export const SERVICE_STATUS_CFG: Record<
  string,
  { color: string; icon: React.ReactNode }
> = {
  running: { color: "var(--green)", icon: <Play className="w-4 h-4" /> },
  paused: { color: "var(--amber)", icon: <Pause className="w-4 h-4" /> },
  stopped: {
    color: "var(--text-muted)",
    icon: <SquareStop className="w-4 h-4" />,
  },
  exited: { color: "var(--red)", icon: <X className="w-4 h-4" /> },
  restarting: {
    color: "var(--purple)",
    icon: <RefreshCcw className="w-4 h-4" />,
  },
};

export function runningRatio(stack: ComposeStack) {
  const total = stack.services.length;
  const running = stack.services.filter((s) => s.status === "running").length;
  return { running, total };
}

export function StackCard({
  stack,
  expanded,
  selected,
  onToggleExpand,
  onSelect,
  onRemove,
  onStart,
  onStop,
  onRestart,
  onPull,
  onServiceToggle,
}: {
  stack: ComposeStack;
  expanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onRemove: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onPull: () => void;
  onServiceToggle: (svc: ComposeService) => void;
}) {
  const cfg = STACK_STATUS_CFG[stack.status];
  const { running, total } = runningRatio(stack);

  return (
    <div
      className="rounded-xl overflow-y-auto transition-all duration-150"
      style={{
        background: selected ? "var(--accent-dim)" : "var(--bg1)",
        border: `1px solid ${selected ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer group"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : "none" }}
        onClick={onToggleExpand}
      >
        <span
          className="text-[10px] transition-transform duration-150 shrink-0"
          style={{
            color: "var(--text-muted)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </span>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ background: `${cfg.color}18`, color: cfg.color }}
        >
          <Layers className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {stack.name}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-px rounded text-[10px] font-mono font-semibold uppercase"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: cfg.dot,
                  boxShadow:
                    stack.status === "running" ? `0 0 4px ${cfg.dot}` : "none",
                  animation:
                    stack.status === "running"
                      ? "pulseGreen 1.5s infinite"
                      : "none",
                }}
              />
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-mono truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {stack.configPath}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ServiceRatioBar stack={stack} />
          <span
            className="text-[11px] font-mono whitespace-nowrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {running}/{total} services
          </span>
        </div>

        <span
          className="text-[10px] font-mono whitespace-nowrap shrink-0"
          style={{ color: "var(--text-muted)" }}
        >
          {stack.lastStarted}
        </span>

        {/* Row actions */}
        <div
          className="flex items-center gap-1 shrink-0 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <StackBtn title="Inspect" onClick={onSelect}>
            <Info className="w-4 h-4" />
          </StackBtn>
          {stack.status === "running" || stack.status === "partial" ? (
            <StackBtn title="Stop stack" onClick={onStop}>
              <Pause className="w-4 h-4" />
            </StackBtn>
          ) : (
            <StackBtn title="Start stack" onClick={onStart}>
              <Play className="w-4 h-4" />
            </StackBtn>
          )}
          <StackBtn title="Restart stack" onClick={onRestart}>
            <RefreshCcw className="w-4 h-4" />
          </StackBtn>
          <StackBtn title="Pull latest images" onClick={onPull}>
            <DownloadCloud className="w-4 h-4" />
          </StackBtn>
          <StackBtn title="Edit compose file">
            <Pencil className="w-4 h-4" />
          </StackBtn>
          <StackBtn title="Remove stack" danger onClick={onRemove}>
            <X className="w-4 -4" />
          </StackBtn>
        </div>
      </div>

      {/* Service rows */}
      {expanded && (
        <div className="flex flex-col">
          {stack.services.map((svc, i) => (
            <ServiceRow
              key={svc.name}
              service={svc}
              last={i === stack.services.length - 1}
              onToggle={() => onServiceToggle(svc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceRatioBar({ stack }: { stack: ComposeStack }) {
  return (
    <div className="flex gap-0.5 items-center">
      {stack.services.map((svc) => {
        const scfg =
          SERVICE_STATUS_CFG[svc.status] ?? SERVICE_STATUS_CFG.stopped;
        return (
          <div
            key={svc.name}
            className="w-2 h-2 rounded-sm"
            style={{ background: scfg.color }}
            title={`${svc.name}: ${svc.status}`}
          />
        );
      })}
    </div>
  );
}

export function StackBtn({
  children,
  title,
  danger,
  small,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  small?: boolean;
  onClick?: () => void;
}) {
  const size = small
    ? "w-[22px] h-[22px] text-[10px]"
    : "w-[26px] h-[26px] text-xs";
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`${size} rounded flex items-center justify-center cursor-pointer border transition-all duration-100`}
      style={{
        background: "var(--bg3)",
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        if (danger) {
          e.currentTarget.style.background = "var(--red-dim)";
          e.currentTarget.style.borderColor = "rgba(255,82,82,0.3)";
          e.currentTarget.style.color = "var(--red)";
        } else {
          e.currentTarget.style.background = "var(--bg4)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      {children}
    </button>
  );
}

export function SmallBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="w-[22px] h-[22px] rounded flex items-center justify-center text-[10px] cursor-pointer border transition-all duration-100"
      style={{
        background: "var(--bg3)",
        borderColor: "var(--border)",
        color: "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg4)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      {children}
    </button>
  );
}
