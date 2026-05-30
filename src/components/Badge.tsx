import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "gray" | "brand";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "gray",
  dot = false,
  className = "",
}) => {
  const variants = {
    success: "bg-success-dim text-success",
    warning: "bg-warning-dim text-warning",
    danger: "bg-danger-dim text-danger",
    gray: "bg-gray-800 text-text-muted",
    brand: "bg-brand-dim text-brand",
  };

  const dotColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    gray: "bg-text-muted",
    brand: "bg-brand",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
