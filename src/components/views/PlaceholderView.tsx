interface PlaceholderViewProps {
  title: string;
  icon?: string;
  description?: string;
}

export default function PlaceholderView({
  title,
  icon,
  description,
}: PlaceholderViewProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {description ?? "Coming soon"}
        </p>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
          }}
        >
          {icon}
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {title} view
        </p>
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          This section is under construction
        </p>
      </div>
    </div>
  );
}
