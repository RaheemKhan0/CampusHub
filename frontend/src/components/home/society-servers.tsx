"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BookOpen,
  Loader2,
  Palette,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";

import { useInfiniteServers } from "@/hooks/servers/useInfiniteServers";
import type { components } from "@/types/openapi";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ServerView = components["schemas"]["ServerViewDto"];

type CategoryMeta = {
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  border: string;
  activePill: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  "Sports & Fitness": {
    icon: <Trophy className="h-4 w-4" />,
    accent: "bg-orange-500",
    iconBg: "bg-orange-500/10 text-orange-500",
    border: "border-orange-500/20",
    activePill: "bg-orange-500 text-white border-transparent shadow-sm",
  },
  "Academic & Professional": {
    icon: <BookOpen className="h-4 w-4" />,
    accent: "bg-sky-500",
    iconBg: "bg-sky-500/10 text-sky-500",
    border: "border-sky-500/20",
    activePill: "bg-sky-500 text-white border-transparent shadow-sm",
  },
  "Arts & Culture": {
    icon: <Palette className="h-4 w-4" />,
    accent: "bg-violet-500",
    iconBg: "bg-violet-500/10 text-violet-500",
    border: "border-violet-500/20",
    activePill: "bg-violet-500 text-white border-transparent shadow-sm",
  },
  "Community & Lifestyle": {
    icon: <Users className="h-4 w-4" />,
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    border: "border-emerald-500/20",
    activePill: "bg-emerald-500 text-white border-transparent shadow-sm",
  },
};

const CATEGORY_ORDER = [
  "Sports & Fitness",
  "Academic & Professional",
  "Arts & Culture",
  "Community & Lifestyle",
];

const DEFAULT_META: CategoryMeta = {
  icon: <Users className="h-4 w-4" />,
  accent: "bg-slate-400",
  iconBg: "bg-slate-400/10 text-slate-500",
  border: "border-slate-400/20",
  activePill: "bg-slate-500 text-white border-transparent shadow-sm",
};

export function SocietyServersSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteServers({ type: "citysocieties" });

  const societies = useMemo<ServerView[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  // Build grouped map in defined order
  const grouped = useMemo(() => {
    const map = new Map<string, ServerView[]>();
    for (const society of societies) {
      const cat = society.category ?? "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(society);
    }
    const sorted = new Map<string, ServerView[]>();
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.set(cat, map.get(cat)!);
    }
    for (const [cat, items] of map) {
      if (!sorted.has(cat)) sorted.set(cat, items);
    }
    return sorted;
  }, [societies]);

  const categories = useMemo(() => Array.from(grouped.keys()), [grouped]);

  // Default to first available category once data loads
  const activeCategory = useMemo(() => {
    if (selectedCategory && grouped.has(selectedCategory)) return selectedCategory;
    return categories[0] ?? null;
  }, [selectedCategory, grouped, categories]);

  const visibleSocieties = useMemo(
    () => (activeCategory ? (grouped.get(activeCategory) ?? []) : []),
    [grouped, activeCategory],
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-5">
          {/* Pill bar skeleton */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-36 rounded-full" />
            ))}
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <Card className="border-destructive/40 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">Unable to load societies</p>
          <p className="mt-1 text-sm text-destructive/80">
            {error?.message ?? "Please try again in a moment."}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </Card>
      );
    }

    if (societies.length === 0) {
      return (
        <Card className="border-border/60 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <p className="font-medium">No societies available yet</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Society servers are coming soon. Check back later.
          </p>
        </Card>
      );
    }

    const activeMeta = activeCategory
      ? (CATEGORY_META[activeCategory] ?? DEFAULT_META)
      : DEFAULT_META;

    return (
      <div className="space-y-5">
        {/* Category pill bar */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? DEFAULT_META;
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? meta.activePill
                    : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center",
                    isActive ? "text-white" : "",
                  )}
                >
                  {meta.icon}
                </span>
                {cat}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {grouped.get(cat)?.length ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active category grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSocieties.map((society) => (
            <SocietyCard key={society.id} society={society} meta={activeMeta} />
          ))}
        </div>

        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              className="gap-2"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            Student societies
          </p>
          <h2 className="text-2xl font-bold text-foreground">Find your community</h2>
          <p className="text-sm text-muted-foreground">
            Browse society servers across sports, academics, arts, and more.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      {renderContent()}
    </section>
  );
}

// ─── Society card ─────────────────────────────────────────────────────────────

function SocietyCard({
  society,
  meta,
}: {
  society: ServerView;
  meta: CategoryMeta;
}) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-md",
        meta.border,
      )}
    >
      <div className={cn("h-1 w-full shrink-0", meta.accent)} />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
              meta.iconBg,
            )}
          >
            {meta.icon}
          </span>
          <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">
            {society.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto border-t border-border/40 pt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/dashboard/server/${society.id}`)}
          className="ml-auto gap-1.5 text-xs"
        >
          Open server
          <ArrowRightIcon className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <Skeleton className="h-1 w-full rounded-none" />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardFooter className="border-t border-border/40 pt-3">
        <Skeleton className="ml-auto h-7 w-24" />
      </CardFooter>
    </Card>
  );
}
