"use client";

import React, { useState } from "react";
import { UrlItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, ExternalLink, QrCode, Sparkles, Shield, Clock, Hash } from "lucide-react";
import { UrlQrDialog } from "./url-qr-dialog";

export function UrlResultCard({
  urlItem,
  onReset,
}: {
  urlItem: UrlItem;
  onReset?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(urlItem.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/90 p-5 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold text-zinc-300">
              Short Link Ready
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[11px] gap-1">
              <Shield className="h-3 w-3" />
              Active
            </Badge>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline-offset-2 hover:underline ml-2"
              >
                Shorten another
              </button>
            )}
          </div>
        </div>

        <div className="py-4 space-y-3">
          {/* Main short link display & action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2 sm:pr-2">
            <div className="flex-1 px-3 py-1.5 text-sm sm:text-base font-semibold text-zinc-100 truncate selection:bg-zinc-800">
              {urlItem.short_url}
            </div>

            <div className="flex items-center gap-1.5 justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs font-medium"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-950" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQr(true)}
                title="View QR Code"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              >
                <QrCode className="h-4 w-4" />
              </Button>

              <a
                href={urlItem.short_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
                title="Test destination redirect"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Long URL metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2 px-1">
            <div className="flex items-center gap-1.5 truncate max-w-md">
              <span className="text-zinc-500">Destination:</span>
              <span className="truncate text-zinc-300" title={urlItem.long_url}>
                {urlItem.long_url}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-zinc-500">
              {urlItem.max_clicks !== null && (
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Cap: {urlItem.max_clicks} clicks
                </span>
              )}
              {urlItem.expire_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires: {formatDate(urlItem.expire_time)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <UrlQrDialog
        url={urlItem.short_url}
        shortCode={urlItem.short_url.split("/").pop()}
        open={showQr}
        onOpenChange={setShowQr}
      />
    </>
  );
}
