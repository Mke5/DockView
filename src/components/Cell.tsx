import React from "react";

export function Cell({
  style,
  children,
}: {
  first?: boolean;
  last?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <td style={{ fontSize: 12, verticalAlign: "middle", ...style }}>
      {children}
    </td>
  );
}
