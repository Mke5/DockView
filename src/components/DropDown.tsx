import { Check } from "lucide-react";

export function Dropdown({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <div
      className="absolute top-full mt-1 z-50 rounded-xl overflow-hidden py-1 min-w-52"
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border-lit)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        right: right ? 0 : undefined,
        left: right ? undefined : 0,
      }}
    >
      {children}
    </div>
  );
}

export function DropdownHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 py-2 text-[9px] font-semibold uppercase tracking-widest font-mono"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </div>
  );
}

export function DropdownCheckItem({
  label,
  sub,
  checked,
  suffix,
  onClick,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  suffix?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all"
      style={{ background: checked ? "var(--accent-dim)" : "transparent" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.background = "var(--bg4)";
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{
          background: checked ? "var(--accent)" : "var(--bg4)",
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-lit)"}`,
          color: "#000",
        }}
      >
        {checked && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1">
        <p
          className="text-xs"
          style={{ color: checked ? "var(--accent)" : "var(--text-secondary)" }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {sub}
          </p>
        )}
      </div>
      {suffix && (
        <span
          className="text-[10px] font-mono shrink-0"
          style={{ color: "var(--accent)" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
