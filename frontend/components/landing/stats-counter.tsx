import React from "react";

const stats = [
  { value: "Instant", label: "Redirect Speed", detail: "Zero waiting time for visitors" },
  { value: "Custom", label: "Branded Names", detail: "Clean, memorable link aliases" },
  { value: "Control", label: "Click & Date Limits", detail: "Set caps or expiry schedules" },
  { value: "QR Ready", label: "Built-in QR Codes", detail: "Ready for packaging, print & mobile" },
];

export function StatsCounter() {
  return (
    <section className="py-12 border-t border-zinc-900 bg-zinc-950 w-full" id="stats">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                {s.value}
              </div>
              <div className="text-xs font-semibold text-zinc-300 mt-1">{s.label}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
