"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

interface UrlFilterBarProps {
  alias: string;
  onAliasChange: (alias: string) => void;
  isActive: boolean | null;
  onIsActiveChange: (active: boolean | null) => void;
  onRefresh: () => void;
  isLoading: boolean;
  total: number;
}

export function UrlFilterBar({
  alias,
  onAliasChange,
  isActive,
  onIsActiveChange,
  onRefresh,
  isLoading,
  total,
}: UrlFilterBarProps) {
  const [searchValue, setSearchValue] = useState(alias);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAliasChange(searchValue);
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 sm:p-4">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Filter by short code alias..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-9 pl-9 text-xs sm:text-sm bg-zinc-950 border-zinc-800"
        />
      </form>

      {/* Filter Tabs & Refresh */}
      <div className="flex items-center gap-3 justify-between sm:justify-end">
        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => onIsActiveChange(null)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              isActive === null
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({total})
          </button>
          <button
            type="button"
            onClick={() => onIsActiveChange(true)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              isActive === true
                ? "bg-zinc-800 text-emerald-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onIsActiveChange(false)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              isActive === false
                ? "bg-zinc-800 text-zinc-300"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Paused
          </button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          isLoading={isLoading}
          title="Refresh list"
          className="h-9 w-9 text-zinc-400 hover:text-zinc-100 border-zinc-800 bg-zinc-950"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
