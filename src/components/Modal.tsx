import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg1)",
          border: "1px solid var(--border-lit)",
          width: wide ? "580px" : "480px",
          maxHeight: "88vh",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          <button
            className="w-6 h-6 rounded flex items-center justify-center text-xs border-none cursor-pointer"
            style={{ background: "none", color: "var(--text-muted)" }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg3)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ModalField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-[10px] font-mono mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

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
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full h-9 px-3 rounded outline-none text-[11px] ${mono ? "font-mono" : ""}`}
      style={{
        background: "var(--bg3)",
        border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
        color: "var(--text-secondary)",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error
          ? "var(--red)"
          : "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error
          ? "var(--red)"
          : "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

export function ModalToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p
          className="text-[11px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        <p
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </p>
      </div>
      <div
        className="relative w-9 h-5 rounded-full cursor-pointer transition-all duration-200 shrink-0"
        style={{
          background: value ? "var(--accent)" : "var(--bg4)",
          border: `1px solid ${value ? "var(--accent)" : "var(--border-lit)"}`,
        }}
        onClick={() => onChange(!value)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
          style={{
            left: value ? "calc(100% - 18px)" : "2px",
            background: value ? "#000" : "var(--text-muted)",
          }}
        />
      </div>
    </div>
  );
}
