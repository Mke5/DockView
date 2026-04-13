import { BuildRecord } from "../../store";

export function StatsBar({ builds }: { builds: BuildRecord[] }) {
  const finished = builds.filter((b) => b.status !== "building");
  if (finished.length === 0) return null;

  const success = builds.filter((b) => b.status === "success").length;
  const failed = builds.filter((b) => b.status === "failed").length;
  const cached = builds.filter((b) => b.status === "cached").length;
  const cancelled = builds.filter((b) => b.status === "cancelled").length;
  const total = finished.length;
  const avgMs =
    builds
      .filter((b) => b.durationMs > 0)
      .reduce((a, b) => a + b.durationMs, 0) /
    Math.max(builds.filter((b) => b.durationMs > 0).length, 1);

  return (
    <div className="flex items-center gap-0 px-6 shrink-0 mb-1">
      <div
        className="flex h-1 rounded-full overflow-hidden flex-1 max-w-xs mr-4"
        style={{ background: "var(--bg4)" }}
      >
        {success > 0 && (
          <div
            style={{
              width: `${(success / total) * 100}%`,
              background: "var(--green)",
            }}
          />
        )}
        {failed > 0 && (
          <div
            style={{
              width: `${(failed / total) * 100}%`,
              background: "var(--red)",
            }}
          />
        )}
        {cached > 0 && (
          <div
            style={{
              width: `${(cached / total) * 100}%`,
              background: "var(--purple)",
            }}
          />
        )}
        {cancelled > 0 && (
          <div
            style={{
              width: `${(cancelled / total) * 100}%`,
              background: "var(--text-muted)",
            }}
          />
        )}
      </div>
      <StatChip color="var(--green)" label="Success" value={success} />
      <StatChip color="var(--red)" label="Failed" value={failed} />
      <StatChip color="var(--purple)" label="Cached" value={cached} />
      <StatChip color="var(--text-muted)" label="Cancelled" value={cancelled} />
      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          Avg duration
        </span>
        <span
          className="text-[11px] font-semibold font-mono"
          style={{ color: "var(--text-secondary)" }}
        >
          {Math.round(avgMs / 1000)}s
        </span>
      </div>
    </div>
  );
}

function StatChip({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  if (value === 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-3">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span
        className="text-[10px] font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span className="text-[11px] font-semibold font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
