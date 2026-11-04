"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsCounter } from "@/components/landing/stats-counter";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaSection } from "@/components/landing/cta-section";
import { AuthModal } from "@/components/auth/auth-modal";
import { UrlItem } from "@/lib/types";

export default function HomePage() {
  const [latestUrl, setLatestUrl] = useState<UrlItem | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100">
      <Navbar />

      <main className="flex-1">
        <HeroSection onUrlCreated={(item) => setLatestUrl(item)} />
        <StatsCounter />
        <FeaturesGrid />
        <HowItWorks />
        <CtaSection />
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
}
