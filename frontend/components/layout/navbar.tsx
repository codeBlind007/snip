"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { Link2, LayoutDashboard, LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, openAuthModal, logout } = useAuth();
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let mounted = true;
    apiClient
      .checkHealth()
      .then((res) => {
        if (mounted) {
          setServerStatus(res.status === "ok" ? "online" : "offline");
        }
      })
      .catch(() => {
        if (mounted) setServerStatus("offline");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto flex h-14 items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-zinc-100 hover:opacity-90 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-950">
              <Link2 className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-100">Snip</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <Link href="/#features" className="hover:text-zinc-200 transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="hover:text-zinc-200 transition-colors">
              How It Works
            </Link>
            <Link href="/#stats" className="hover:text-zinc-200 transition-colors">
              Performance
            </Link>
            {user && (
              <Link href="/dashboard" className="text-zinc-200 flex items-center gap-1.5 hover:text-white transition-colors">
                <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-3">
          {/* Server health pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400"
            title={`Backend status: ${serverStatus}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                serverStatus === "online"
                  ? "bg-emerald-400"
                  : serverStatus === "offline"
                  ? "bg-red-400"
                  : "bg-zinc-500 animate-pulse"
              }`}
            />
            <span>{serverStatus === "online" ? "API Live" : serverStatus === "offline" ? "API Standby" : "Connecting"}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="hidden sm:inline max-w-[140px] truncate">{user.fullname}</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Sign out"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal("login")}
                className="text-xs text-zinc-300 hover:text-zinc-100"
              >
                Sign In
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openAuthModal("signup")}
                className="text-xs"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
