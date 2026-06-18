import React from "react";

export function Button({
  variant = "primary",
  className = "",
  onClick,
  disabled,
  children,
}: {
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    variant === "primary"
      ? "btn btn-primary"
      : "btn";

  return (
    <button
      className={`${cls} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
