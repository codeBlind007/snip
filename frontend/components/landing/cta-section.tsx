"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export function CtaSection() {
  const { user, openAuthModal } = useAuth();

  return (
    <section className="py-16 md:py-24 border-t border-zinc-900 bg-zinc-950 w-full">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-14 text-center shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 max-w-xl mx-auto">
            Take full control of your short links.
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Create custom aliases, configure click caps, and monitor live performance from your dashboard.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-xs sm:text-sm">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open Your Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => openAuthModal("signup")}
                  className="w-full sm:w-auto gap-2 text-xs sm:text-sm"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => openAuthModal("login")}
                  className="w-full sm:w-auto text-xs sm:text-sm border-zinc-800"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
