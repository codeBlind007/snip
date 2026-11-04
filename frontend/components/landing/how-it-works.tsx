import React from "react";
import { Link2, Sparkles, Share2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Link2,
      title: "Paste Your Link",
      desc: "Paste any long URL into the shortener. Optionally add a custom name, click limit, or expiration date.",
    },
    {
      step: "02",
      icon: Sparkles,
      title: "Get Short Link & QR",
      desc: "Instantly receive a neat, clean short link along with a ready-to-download QR code.",
    },
    {
      step: "03",
      icon: Share2,
      title: "Share Anywhere",
      desc: "Share your link on social media, messages, or print. Visitors are redirected immediately without waiting.",
    },
  ];

  return (
    <section className="py-16 md:py-20 border-t border-zinc-900 bg-zinc-950/60 w-full" id="how-it-works">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-12">
          <h2 className="text-xs font-semibold text-zinc-400 mb-2">
            Simple 3-Step Process
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            How It Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative w-full">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-500">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
