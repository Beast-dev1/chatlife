"use client";

export function Spinner({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-10 w-10 border-2",
  };
  return (
    <div
      className={`animate-spin rounded-full border-primary-500 border-t-transparent ${sizeClasses[size]} ${className}`}
      aria-hidden
    />
  );
}
