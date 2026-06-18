import React from "react";

export function RowBtn({
  title,
  danger,
  disabled,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="btn-icon"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={
        danger
          ? ({ color: "var(--red)" } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </button>
  );
}
