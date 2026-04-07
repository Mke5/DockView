import { ContainerStatus } from "../store/";

const CONFIG: Record<
  ContainerStatus,
  {
    bg: string;
    color: string;
    dotGlow: string;
    label: string;
    animate: boolean;
  }
> = {
  running: {
    bg: "var(--green-dim)",
    color: "var(--green)",
    dotGlow: "var(--green)",
    label: "running",
    animate: true,
  },
  paused: {
    bg: "var(--amber-dim)",
    color: "var(--amber)",
    dotGlow: "none",
    label: "paused",
    animate: false,
  },
  stopped: {
    bg: "var(--bg4)",
    color: "var(--text-muted)",
    dotGlow: "none",
    label: "stopped",
    animate: false,
  },
  exited: {
    bg: "var(--red-dim)",
    color: "var(--red)",
    dotGlow: "none",
    label: "exited",
    animate: false,
  },
};

interface StatusBadgeProps {
  status: ContainerStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = CONFIG[status];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase tracking-wide"
      style={{ background: c.bg, color: c.color }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.animate ? "pulse-green" : ""}`}
        style={{
          background: c.color,
          boxShadow: c.animate ? `0 0 4px ${c.dotGlow}` : "none",
        }}
      />
      {c.label}
    </span>
  );
}
