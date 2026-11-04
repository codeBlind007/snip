"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";
import { UrlItem } from "@/lib/types";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { UrlShortenerCard } from "@/components/url/url-shortener-card";
import { UrlFilterBar } from "@/components/url/url-filter-bar";
import { UrlListTable } from "@/components/url/url-list-table";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  Link2,
  Activity,
  MousePointerClick,
  PlusCircle,
  LogIn,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading, openAuthModal } = useAuth();

  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [aliasFilter, setAliasFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);

  const fetchUrls = useCallback(
    async (targetPage = page, targetAlias = aliasFilter, targetActive = isActiveFilter) => {
      setLoadingUrls(true);
      try {
        const res = await apiClient.getUrls({
          page: targetPage,
          alias: targetAlias || undefined,
          is_active: targetActive !== null ? targetActive : undefined,
        });
        setUrls(res.urls);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.total_pages);
      } catch (err) {
        console.error("Failed to load URLs", err);
      } finally {
        setLoadingUrls(false);
      }
    },
    [page, aliasFilter, isActiveFilter]
  );

  useEffect(() => {
    if (user) {
      fetchUrls();
    }
  }, [user, fetchUrls]);

  const handleAliasChange = (newAlias: string) => {
    setAliasFilter(newAlias);
    setPage(1);
    fetchUrls(1, newAlias, isActiveFilter);
  };

  const handleActiveChange = (active: boolean | null) => {
    setIsActiveFilter(active);
    setPage(1);
    fetchUrls(1, aliasFilter, active);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUrls(newPage, aliasFilter, isActiveFilter);
  };

  const handleUrlCreated = (newUrl: UrlItem) => {
    setUrls((prev) => [newUrl, ...prev]);
    setTotal((prev) => prev + 1);
    setShowCreateCard(false);
  };

  const handleUrlUpdated = (updated: UrlItem) => {
    setUrls((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  // Only calculate click metrics for links that have max_clicks configured
  const cappedLinks = urls.filter((u) => u.max_clicks !== null);
  const cappedClicks = cappedLinks.reduce((sum, u) => sum + u.click_count, 0);
  const activeCount = urls.filter((u) => u.is_active).length;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {!user && !authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Authentication Required
            </h1>
            <p className="text-xs text-zinc-400 mt-2 mb-6">
              Please sign in to view your shortened URLs and manage link configurations.
            </p>
            <Button onClick={() => openAuthModal("login")} className="gap-2 text-xs">
              <LogIn className="h-4 w-4" />
              <span>Sign In to Dashboard</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                  Link Dashboard
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage your short links, configure expiration, and analyze redirect traffic.
                </p>
              </div>

              <Button
                variant={showCreateCard ? "secondary" : "default"}
                size="sm"
                onClick={() => setShowCreateCard(!showCreateCard)}
                className="gap-2 text-xs self-start sm:self-center"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{showCreateCard ? "Close Shortener" : "Create Short Link"}</span>
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Total Links</span>
                  <Link2 className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="text-2xl font-semibold text-zinc-100 mt-2">
                  {total}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Active Links</span>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-semibold text-zinc-100 mt-2">
                  {activeCount}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>Clicks (Capped Links)</span>
                  <MousePointerClick className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-semibold text-zinc-100 mt-2">
                  {cappedClicks}
                </div>
              </div>
            </div>

            {/* Expandable Creation Section */}
            {showCreateCard && (
              <div className="animate-in fade-in duration-200 w-full">
                <UrlShortenerCard onCreated={handleUrlCreated} autoFocus />
              </div>
            )}

            {/* Filter and Search Bar */}
            <UrlFilterBar
              alias={aliasFilter}
              onAliasChange={handleAliasChange}
              isActive={isActiveFilter}
              onIsActiveChange={handleActiveChange}
              onRefresh={() => fetchUrls()}
              isLoading={loadingUrls}
              total={total}
            />

            {/* Links Table */}
            <UrlListTable
              urls={urls}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onUrlUpdated={handleUrlUpdated}
              isLoading={loadingUrls}
            />
          </div>
        )}
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
}
