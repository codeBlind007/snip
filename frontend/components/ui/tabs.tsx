"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full flex flex-col", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{
            currentValue?: string;
            onSelect?: (val: string) => void;
          }>, {
            currentValue: value,
            onSelect: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({
  children,
  className,
  currentValue,
  onSelect,
}: {
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
  onSelect?: (val: string) => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900/90 p-1 text-zinc-400 border border-zinc-800/80",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{
            currentValue?: string;
            onSelect?: (val: string) => void;
          }>, {
            currentValue,
            onSelect,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  currentValue,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
  onSelect?: (val: string) => void;
}) {
  const isSelected = currentValue === value;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer",
        isSelected
          ? "bg-zinc-800 text-zinc-100 shadow-sm"
          : "text-zinc-400 hover:text-zinc-200",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  currentValue,
  className,
}: {
  value: string;
  children: React.ReactNode;
  currentValue?: string;
  className?: string;
}) {
  if (currentValue !== value) return null;
  return <div className={cn("mt-4 focus-visible:outline-none", className)}>{children}</div>;
}

