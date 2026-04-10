"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Palette,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";

import { useInfiniteServers } from "@/hooks/servers/useInfiniteServers";
import type { components } from "@/types/openapi";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ServerView = components["schemas"]["ServerViewDto"];

const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; accent: string; iconBg: string }
> = {
  "Sports & Fitness": {
    icon: <Trophy className="h-4 w-4" />,
    accent: "bg-orange-500",
    iconBg: "bg-orange-500/10 text-orange-500",
  },
  "Academic & Professional": {
    icon: <BookOpen className="h-4 w-4" />,
    accent: "bg-sky-500",
    iconBg: "bg-sky-500/10 text-sky-500",
  },
  "Arts & Culture": {
    icon: <Palette className="h-4 w-4" />,
    accent: "bg-violet-500",
    iconBg: "bg-violet-500/10 text-violet-500",
  },
  "Community & Lifestyle": {
    icon: <Users className="h-4 w-4" />,
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-500",
  },
};

const CATEGORY_ORDER = [
  "Sports & Fitness",
  "Academic & Professional",
  "Arts & Culture",
  "Community & Lifestyle",
];

const DEFAULT_META = {
  icon: <Users className="h-4 w-4" />,
  accent: "bg-slate-400",
  iconBg: "bg-slate-400/10 text-slate-500",
};

export function SocietyServersSection() {
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

  const grouped = useMemo(() => {
    const map = new Map<string, ServerView[]>();
    for (const society of societies) {
      const cat = society.category ?? "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(society);
    }
    // Sort by the defined order, then append any unknown categories
    const sorted = new Map<string, ServerView[]>();
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.set(cat, map.get(cat)!);
    }
    for (const [cat, items] of map) {
      if (!sorted.has(cat)) sorted.set(cat, items);
    }
    return sorted;
  }, [societies]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Unable to load societies
            </CardTitle>
            <p className="text-sm text-destructive/80">
              {error?.message ?? "Please try again in a moment."}
            </p>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (societies.length === 0) {
      return (
        <Card className="border-border/60">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <CardTitle className="text-base">No societies available yet</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Society servers are coming soon. Check back later.
            </p>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([category, items]) => (
          <CategoryRow key={category} category={category} items={items} />
        ))}

        {hasNextPage && (
          <div className="flex justify-center">
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
          <h2 className="text-2xl font-bold text-foreground">
            Find your community
          </h2>
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

// ─── Category row ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  items,
}: {
  category: string;
  items: ServerView[];
}) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const meta = CATEGORY_META[category] ?? DEFAULT_META;

  const scroll = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth : el.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-4">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              meta.iconBg,
            )}
          >
            {meta.icon}
          </span>
          <h3 className="text-base font-semibold text-foreground">{category}</h3>
          <span className="text-xs text-muted-foreground/60">
            {items.length} {items.length === 1 ? "society" : "societies"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Horizontal slider */}
      <div
        ref={sliderRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {items.map((society) => (
          <Card
            key={society.id}
            className="flex min-w-[240px] max-w-[280px] flex-shrink-0 snap-start flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className={cn("h-1.5 w-full shrink-0", meta.accent)} />
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
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
                variant="secondary"
                onClick={() => router.push(`/dashboard/server/${society.id}`)}
                className="ml-auto gap-1.5"
              >
                Open
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex gap-4 overflow-x-hidden pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="min-w-[240px] max-w-[280px] flex-shrink-0 overflow-hidden border-border/50"
          >
            <Skeleton className="h-1.5 w-full rounded-none" />
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardFooter className="border-t border-border/40 pt-3">
              <Skeleton className="ml-auto h-8 w-16" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
