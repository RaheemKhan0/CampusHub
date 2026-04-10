"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
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

type ServerView = components["schemas"]["ServerViewDto"];

export function SocietyServersSection() {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth : el.clientWidth,
      behavior: "smooth",
    });
  };

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex gap-4 overflow-x-hidden pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SocietyCardSkeleton key={i} />
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
      <>
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div
            ref={sliderRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
          >
            {societies.map((society) => (
              <Card
                key={society.id}
                className="flex min-w-[260px] max-w-[300px] flex-shrink-0 snap-start flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="h-1.5 w-full shrink-0 bg-primary/60" />
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                        Society
                      </p>
                      <CardTitle className="mt-0.5 line-clamp-2 text-base font-bold leading-snug">
                        {society.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <p className="line-clamp-1 text-sm capitalize text-muted-foreground">
                    {society.slug.replace(/-/g, " ")}
                  </p>
                </CardContent>
                <CardFooter className="border-t border-border/40 pt-3">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/server/${society.id}`)}
                    className="ml-auto gap-1.5"
                  >
                    Open society
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

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
                "Load more societies"
              )}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            Student societies
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            Find your community
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse society servers for sports clubs, academic groups, and student
            interest communities.
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

function SocietyCardSkeleton() {
  return (
    <Card className="min-w-[260px] max-w-[300px] flex-shrink-0 snap-start overflow-hidden border-border/50">
      <Skeleton className="h-1.5 w-full rounded-none" />
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="border-t border-border/40 pt-3">
        <Skeleton className="ml-auto h-8 w-28" />
      </CardFooter>
    </Card>
  );
}
