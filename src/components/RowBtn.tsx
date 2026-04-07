export function RowBtn({
  children,
  title,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="w-[26px] h-[26px] rounded flex items-center justify-center text-xs cursor-pointer border transition-all duration-100"
      style={{
        background: "var(--bg3)",
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        if (danger) {
          e.currentTarget.style.background = "var(--red-dim)";
          e.currentTarget.style.borderColor = "rgba(255,82,82,0.3)";
          e.currentTarget.style.color = "var(--red)";
        } else {
          e.currentTarget.style.background = "var(--bg4)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      {children}
    </button>
  );
}
