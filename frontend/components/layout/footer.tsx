import React from "react";
import { Link2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6 text-xs text-zinc-500">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-zinc-950">
            <Link2 className="h-3 w-3" />
          </div>
          <span className="font-semibold text-zinc-200 text-sm">Snip</span>
        </div>
        <p className="text-zinc-500">© 2026 Snip. URL Shortener.</p>
      </div>
    </footer>
  );
}
