"use client";

import React, { useState, useEffect } from "react";
import { UrlItem, UrlUpdateRequest } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Calendar, Hash, Shield } from "lucide-react";

interface UrlEditDialogProps {
  urlItem: UrlItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: UrlItem) => void;
}

export function UrlEditDialog({ urlItem, open, onOpenChange, onSuccess }: UrlEditDialogProps) {
  const [isActive, setIsActive] = useState(true);
  const [maxClicks, setMaxClicks] = useState<string>("");
  const [expireTime, setExpireTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlItem) {
      setIsActive(urlItem.is_active);
      setMaxClicks(urlItem.max_clicks !== null && urlItem.max_clicks !== undefined ? String(urlItem.max_clicks) : "");
      if (urlItem.expire_time) {
        // Convert to local datetime-local string
        const d = new Date(urlItem.expire_time);
        if (!isNaN(d.getTime())) {
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localIso = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setExpireTime(localIso);
        } else {
          setExpireTime("");
        }
      } else {
        setExpireTime("");
      }
      setError(null);
    }
  }, [urlItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlItem) return;

    setError(null);
    setLoading(true);

    try {
      const payload: UrlUpdateRequest = {
        is_active: isActive,
        max_clicks: maxClicks.trim() ? parseInt(maxClicks, 10) : null,
        expire_time: expireTime ? new Date(expireTime).toISOString() : null,
      };

      const updated = await apiClient.updateUrl(urlItem.id, payload);
      onSuccess(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update URL configuration");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!urlItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Link</DialogTitle>
          <DialogDescription className="truncate max-w-[340px]">
            {urlItem.short_url}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-950/40 border border-red-900/50 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-400" />
                <Label htmlFor="active-toggle" className="text-sm font-medium text-zinc-200">
                  Link Status
                </Label>
              </div>
              <p className="text-xs text-zinc-500">
                {isActive ? "Link is active and accepting redirects" : "Link is paused and returning 410"}
              </p>
            </div>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Max Clicks */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-max-clicks" className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-zinc-400" />
              <span>Max Clicks Cap (optional)</span>
            </Label>
            <Input
              id="edit-max-clicks"
              type="number"
              min="1"
              placeholder="Leave empty for unlimited clicks"
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
            />
            <p className="text-[11px] text-zinc-500">
              Current clicks: {urlItem.click_count}. Link will expire once cap is reached.
            </p>
          </div>

          {/* Expiration Time */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-expire" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Expiration Date & Time (optional)</span>
            </Label>
            <Input
              id="edit-expire"
              type="datetime-local"
              value={expireTime}
              onChange={(e) => setExpireTime(e.target.value)}
            />
            <p className="text-[11px] text-zinc-500">
              Leave blank if this link should never expire by date.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={loading}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

