import React from "react";
export { Modal } from "./shared/ui";

// ─── ModalField ───────────────────────────────────────────────────────────────

export function ModalField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          className="text-[11px] font-medium"
          style={{ color: "var(--text-1)" }}
        >
          {label}
        </label>
        {description && (
          <span
            className="text-[9px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── ModalInput ───────────────────────────────────────────────────────────────

export function ModalInput({
  value,
  onChange,
  placeholder,
  mono,
  autoFocus,
  error,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <input
      className={`input ${mono ? "mono" : ""} ${error ? "error" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={style}
    />
  );
}

// ─── ModalToggleRow ───────────────────────────────────────────────────────────

export function ModalToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!value)}>
      <div>
        <div style={{ fontSize: 12.5, color: "var(--text-0)" }}>{label}</div>
        {description && (
          <div
            className="field-hint"
            style={{ fontFamily: "IBM Plex Mono, monospace" }}
          >
            {description}
          </div>
        )}
      </div>
      <div className={`toggle ${value ? "on" : ""}`} />
    </div>
  );
}
