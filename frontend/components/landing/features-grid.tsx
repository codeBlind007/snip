import React from "react";
import { Zap, Clock, Hash, Sparkles, QrCode, PauseCircle } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Redirects",
    description:
      "Your links open immediately with zero waiting time or loading screens for your visitors.",
  },
  {
    icon: Sparkles,
    title: "Custom Short Links",
    description:
      "Pick memorable, branded names (like snip/launch or snip/promo) instead of messy random letters.",
  },
  {
    icon: Hash,
    title: "Click Limits",
    description:
      "Set a maximum number of clicks for limited-time offers, early-access invites, or private giveaways.",
  },
  {
    icon: Clock,
    title: "Scheduled Expiration",
    description:
      "Schedule your link to turn off automatically on a specific date and time when your campaign ends.",
  },
  {
    icon: QrCode,
    title: "One-Click QR Codes",
    description:
      "Generate and download high-resolution QR codes ready for flyers, packaging, menus, or social sharing.",
  },
  {
    icon: PauseCircle,
    title: "Pause or Edit Anytime",
    description:
      "Temporarily pause link traffic or change settings anytime directly from your personal dashboard.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-16 md:py-24 border-t border-zinc-900 bg-zinc-950 w-full" id="features">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mb-12">
          <h2 className="text-xs font-semibold text-zinc-400 mb-2">
            Features Built For You
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Everything you need to share and control your links
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
