import React from "react";

export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <span
        className="text-[10px] font-mono shrink-0"
        style={{ color: "var(--text-muted)", minWidth: 60 }}
      >
        {label}
      </span>
      <span
        className={`text-[11px] ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text-secondary)", wordBreak: "break-all" }}
      >
        {value}
      </span>
    </div>
  );
}
