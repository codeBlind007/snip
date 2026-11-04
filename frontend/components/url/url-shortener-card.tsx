"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";
import { UrlCreateRequest, UrlItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UrlResultCard } from "./url-result-card";
import {
  Link2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Hash,
  Clock,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

export function UrlShortenerCard({
  onCreated,
  autoFocus = false,
}: {
  onCreated?: (item: UrlItem) => void;
  autoFocus?: boolean;
}) {
  const { user, openAuthModal } = useAuth();

  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [expireTime, setExpireTime] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultItem, setResultItem] = useState<UrlItem | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Format URL
    let formattedUrl = longUrl.trim();
    if (!formattedUrl) {
      setError("Please enter a valid URL to shorten");
      return;
    }

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError("Please provide a valid destination URL");
      return;
    }

    // Require auth
    if (!user) {
      openAuthModal("login");
      return;
    }

    // Custom alias validation
    const trimmedAlias = customAlias.trim();
    if (trimmedAlias) {
      if (trimmedAlias.length < 3 || trimmedAlias.length > 30) {
        setError("Custom alias must be between 3 and 30 characters");
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedAlias)) {
        setError("Alias can contain only letters, numbers, hyphens, and underscores");
        return;
      }
      const reserved = ["api", "admin", "login", "docs", "health"];
      if (reserved.includes(trimmedAlias.toLowerCase())) {
        setError(`The alias "${trimmedAlias}" is reserved. Please pick another.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload: UrlCreateRequest = {
        long_url: formattedUrl,
        custom_alias: trimmedAlias || null,
        max_clicks: maxClicks.trim() ? parseInt(maxClicks, 10) : null,
        expire_time: expireTime ? new Date(expireTime).toISOString() : null,
      };

      const res = await apiClient.createUrl(payload);
      setResultItem(res);
      onCreated?.(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create short URL. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResultItem(null);
    setLongUrl("");
    setCustomAlias("");
    setMaxClicks("");
    setExpireTime("");
    setError(null);
  };

  if (resultItem) {
    return <UrlResultCard urlItem={resultItem} onReset={handleReset} />;
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-900/50 p-3 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                autoFocus={autoFocus}
                placeholder="Paste your long link here (e.g. https://github.com/project)..."
                className="h-11 pl-10 pr-4 text-sm sm:text-base bg-zinc-950 border-zinc-800 focus-visible:border-zinc-400"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-11 px-6 font-medium gap-2 shrink-0 text-sm"
              isLoading={loading}
            >
              <span>Shorten</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Advanced link settings</span>
            {showAdvanced ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-4 animate-in fade-in duration-200">
              {/* Custom Alias */}
              <div className="space-y-1.5">
                <Label htmlFor="alias" className="text-zinc-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-zinc-500" />
                  Custom Alias
                </Label>
                <div className="relative">
                  <Input
                    id="alias"
                    type="text"
                    placeholder="my-link"
                    maxLength={30}
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="h-8 text-xs bg-zinc-900 border-zinc-800"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">3-30 letters or numbers</p>
              </div>

              {/* Max Clicks */}
              <div className="space-y-1.5">
                <Label htmlFor="maxClicks" className="text-zinc-400 flex items-center gap-1">
                  <Hash className="h-3 w-3 text-zinc-500" />
                  Max Clicks
                </Label>
                <Input
                  id="maxClicks"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxClicks}
                  onChange={(e) => setMaxClicks(e.target.value)}
                  className="h-8 text-xs bg-zinc-900 border-zinc-800"
                />
                <p className="text-[10px] text-zinc-500">Auto-expires after cap</p>
              </div>

              {/* Expiration DateTime */}
              <div className="space-y-1.5">
                <Label htmlFor="expireTime" className="text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  Expire Date
                </Label>
                <Input
                  id="expireTime"
                  type="datetime-local"
                  value={expireTime}
                  onChange={(e) => setExpireTime(e.target.value)}
                  className="h-8 text-xs bg-zinc-900 border-zinc-800"
                />
                <p className="text-[10px] text-zinc-500">Auto-expires by time</p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

