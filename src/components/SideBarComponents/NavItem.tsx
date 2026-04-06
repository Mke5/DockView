import { ViewSection } from "../../store";

interface NavItem {
  id: ViewSection;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: "running" | "count" | "warn";
}

export function NavBtn({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const badgeStyle = {
    running: { background: "var(--green-dim)", color: "var(--green)" },
    count: { background: "var(--bg4)", color: "var(--text-muted)" },
    warn: { background: "var(--amber-dim)", color: "var(--amber)" },
  };

  return (
    <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="text-sm w-[18px] text-center shrink-0">{item.icon}</span>
      <span className="text-xs flex-1 font-medium">{item.label}</span>
      {item.badge && (
        <span
          className="text-[9px] font-semibold font-mono px-1.5 py-0.5 rounded-full"
          style={badgeStyle[item.badgeType ?? "count"]}
        >
          {item.badge}
        </span>
      )}
    </div>
  );
}
