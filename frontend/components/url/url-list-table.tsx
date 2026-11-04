"use client";

import React, { useState } from "react";
import { UrlItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UrlEditDialog } from "./url-edit-dialog";
import { UrlQrDialog } from "./url-qr-dialog";
import {
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Settings2,
  Clock,
  Hash,
  ChevronLeft,
  ChevronRight,
  Link2Off,
} from "lucide-react";

interface UrlListTableProps {
  urls: UrlItem[];
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onUrlUpdated: (updated: UrlItem) => void;
  isLoading: boolean;
}

export function UrlListTable({
  urls,
  page,
  totalPages,
  onPageChange,
  onUrlUpdated,
  isLoading,
}: UrlListTableProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<UrlItem | null>(null);
  const [selectedForQr, setSelectedForQr] = useState<UrlItem | null>(null);

  const handleCopy = (id: number, shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading && urls.length === 0) {
    return (
      <div className="space-y-3 py-6 w-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 w-full animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/40"
          />
        ))}
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 px-4 text-center w-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500 mb-3">
          <Link2Off className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">No short links found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          You haven&apos;t created any links matching this filter yet. Create your first short link above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-3 w-full">
        {urls.map((url) => {
          const isExpired = url.expire_time && new Date(url.expire_time).getTime() < Date.now();
          const isCapped = url.max_clicks !== null && url.click_count >= url.max_clicks;

          return (
            <div
              key={url.id}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-5 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/80"
            >
              {/* URL Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-100 truncate tracking-tight">
                    {url.short_url}
                  </span>

                  {/* Status Badge */}
                  {!url.is_active ? (
                    <Badge variant="muted" className="text-[10px]">
                      Paused
                    </Badge>
                  ) : isExpired ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Expired
                    </Badge>
                  ) : isCapped ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Cap Reached
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px]">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="truncate max-w-md sm:max-w-xl lg:max-w-3xl text-[12px] text-zinc-500 hover:text-zinc-400 transition-colors" title={url.long_url}>
                    {url.long_url}
                  </span>
                </div>

                {/* Metadata Pills */}
                <div className="flex items-center gap-4 text-[11px] text-zinc-500 flex-wrap pt-0.5">
                  {/* DO NOT show click count when max_clicks is null */}
                  {url.max_clicks !== null && (
                    <span className="flex items-center gap-1 text-zinc-400 font-medium">
                      <Hash className="h-3 w-3 text-zinc-500" />
                      <span>
                        {url.click_count} / {url.max_clicks} clicks
                      </span>
                    </span>
                  )}

                  {url.expire_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>Expires {formatDate(url.expire_time)}</span>
                    </span>
                  )}

                  <span>Created {formatDate(url.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(url.id, url.short_url)}
                  className="h-8 text-xs gap-1.5 border-zinc-800"
                >
                  {copiedId === url.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedForQr(url)}
                  title="Show QR Code"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                >
                  <QrCode className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedForEdit(url)}
                  title="Configure Link"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>

                <a
                  href={url.short_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  title="Open Short URL"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-xs text-zinc-400 w-full">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 gap-1 text-xs border-zinc-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 gap-1 text-xs border-zinc-800"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <UrlEditDialog
        urlItem={selectedForEdit}
        open={!!selectedForEdit}
        onOpenChange={(open) => !open && setSelectedForEdit(null)}
        onSuccess={(updated) => {
          onUrlUpdated(updated);
          setSelectedForEdit(null);
        }}
      />

      <UrlQrDialog
        url={selectedForQr?.short_url || null}
        shortCode={selectedForQr?.short_url.split("/").pop()}
        open={!!selectedForQr}
        onOpenChange={(open) => !open && setSelectedForQr(null)}
      />
    </div>
  );
}
