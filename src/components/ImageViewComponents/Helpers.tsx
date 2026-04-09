export function SizeBar({
  sizeBytes,
  label,
  showFull = false,
}: {
  sizeBytes: number;
  label: string;
  showFull?: boolean;
}) {
  const pct = Math.min((sizeBytes / 1e9) * 100, 100);
  const barColor =
    sizeBytes > 500e6
      ? "var(--red)"
      : sizeBytes > 200e6
        ? "var(--amber)"
        : "var(--green)";
  return (
    <div className={showFull ? "w-full" : "flex items-center gap-1.5"}>
      <div
        className={`h-1 rounded-full overflow-hidden ${showFull ? "w-full mb-1.5" : "w-10 shrink-0"}`}
        style={{ background: "var(--bg4)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span
        className="text-[10px] font-mono whitespace-nowrap"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      {showFull && (
        <span
          className="text-[9px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          relative to 1 GB
        </span>
      )}
    </div>
  );
}
