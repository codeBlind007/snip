"use client";

import React from "react";
import { UrlShortenerCard } from "@/components/url/url-shortener-card";
import { ShieldCheck, Zap, QrCode } from "lucide-react";
import { UrlItem } from "@/lib/types";

export function HeroSection({ onUrlCreated }: { onUrlCreated?: (item: UrlItem) => void }) {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden w-full" id="shorten">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 text-center">
        {/* Simple Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs text-zinc-400 mb-6 shadow-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Simple, fast & reliable link shortener</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-100 max-w-4xl mx-auto leading-[1.15]">
          Clean short links that get you more clicks.
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Turn long, messy URLs into clean, memorable links. Add custom names, click limits, expiry dates, and download QR codes in seconds.
        </p>

        {/* Interactive URL Shortener Card */}
        <div className="mt-10 max-w-3xl mx-auto text-left w-full">
          <UrlShortenerCard onCreated={onUrlCreated} />
        </div>

        {/* User-friendly benefits banner */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-zinc-400" />
            <span>Instant redirects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-zinc-400" />
            <span>Downloadable QR codes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
            <span>Safe & reliable</span>
          </div>
        </div>
      </div>
    </section>
  );
}
