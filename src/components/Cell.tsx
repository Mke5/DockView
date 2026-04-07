export function Cell({
  children,
  first,
  last,
  className = "",
  style,
}: {
  children?: React.ReactNode;
  first?: boolean;
  last?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td
      className={className}
      style={{
        padding: "10px 12px",
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderLeft: first ? "1px solid" : "none",
        borderRight: last ? "1px solid" : "none",
        borderRadius: first ? "6px 0 0 6px" : last ? "0 6px 6px 0" : undefined,
        transition: "background 0.1s, border-color 0.1s",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
