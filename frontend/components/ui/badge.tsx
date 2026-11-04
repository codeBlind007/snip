import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "muted" | "destructive";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
    secondary: "border-transparent bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
    outline: "text-zinc-400 border-zinc-800",
    success: "border-emerald-900/60 bg-emerald-950/40 text-emerald-400",
    muted: "border-zinc-800 bg-zinc-900/90 text-zinc-400",
    destructive: "border-red-900/50 bg-red-950/40 text-red-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

