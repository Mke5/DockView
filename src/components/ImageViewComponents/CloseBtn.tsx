import { X } from "lucide-react";

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="w-6 h-6 rounded flex items-center justify-center text-xs border-none cursor-pointer"
      style={{ background: "none", color: "var(--text-muted)" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      <X className="w-3 h-3" />
    </button>
  );
}
