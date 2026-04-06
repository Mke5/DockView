export function ResourceBar({
  label,
  value,
  fill,
  color,
}: {
  label: string;
  value: string;
  fill: number;
  color: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span
          className="text-[11px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-mono"
          style={{ color: "var(--text-secondary)" }}
        >
          {value}
        </span>
      </div>
      <div
        className="h-[3px] rounded-full overflow-hidden"
        style={{ background: "var(--bg4)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(fill, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}
