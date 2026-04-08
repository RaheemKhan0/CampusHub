"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  Server,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type ServerView = components["schemas"]["ServerViewDto"];

function getYearAccent(year: number | undefined) {
  const n = year ?? 0;
  if (n === 1)
    return {
      strip: "bg-sky-500",
      icon: "bg-sky-500/10 text-sky-500",
      label: "text-sky-600 dark:text-sky-400",
      activePill: "bg-sky-500 text-white border-transparent shadow-sm",
    };
  if (n === 2)
    return {
      strip: "bg-violet-500",
      icon: "bg-violet-500/10 text-violet-500",
      label: "text-violet-600 dark:text-violet-400",
      activePill: "bg-violet-500 text-white border-transparent shadow-sm",
    };
  if (n === 3)
    return {
      strip: "bg-emerald-500",
      icon: "bg-emerald-500/10 text-emerald-500",
      label: "text-emerald-600 dark:text-emerald-400",
      activePill: "bg-emerald-500 text-white border-transparent shadow-sm",
    };
  if (n === 4)
    return {
      strip: "bg-amber-500",
      icon: "bg-amber-500/10 text-amber-500",
      label: "text-amber-600 dark:text-amber-400",
      activePill: "bg-amber-500 text-white border-transparent shadow-sm",
    };
  return {
    strip: "bg-slate-400",
    icon: "bg-slate-400/10 text-slate-500",
    label: "text-slate-500",
    activePill: "bg-slate-500 text-white border-transparent shadow-sm",
  };
}

export function UniversityModulesSection() {
  const router = useRouter();
  const defaultSliderRef = useRef<HTMLDivElement | null>(null);
  const resultsSliderRef = useRef<HTMLDivElement | null>(null);
  const scrollDefaultSlider = (direction: "left" | "right") => {
    const container = defaultSliderRef.current;
    if (!container) return;
    const offset =
      direction === "left" ? -container.clientWidth : container.clientWidth;
    container.scrollBy({ left: offset, behavior: "smooth" });
  };
  const loadingSliderRef = useRef<HTMLDivElement | null>(null);
  const scrollLoadingSlider = (direction: "left" | "right") => {
    const container = loadingSliderRef.current;
    if (!container) return;
    const offset =
      direction === "left" ? -container.clientWidth : container.clientWidth;
    container.scrollBy({ left: offset, behavior: "smooth" });
  };
  const scrollResultsSlider = (direction: "left" | "right") => {
    const container = resultsSliderRef.current;
    if (!container) return;
    const offset =
      direction === "left" ? -container.clientWidth : container.clientWidth;
    container.scrollBy({ left: offset, behavior: "smooth" });
  };

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const moduleFilters = useMemo(() => {
    const degreeSlug = session?.user?.degreeSlug;
    const startYear = session?.user?.startYear;
    if (!degreeSlug || typeof startYear !== "number") {
      return undefined;
    }
    return {
      type: "unimodules" as const,
      degreeSlug,
      startYear,
    };
  }, [session?.user?.degreeSlug, session?.user?.startYear]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteServers(moduleFilters, { enabled: Boolean(moduleFilters) });

  const modules = useMemo<ServerView[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const { yearOptions, hasOtherGroups } = useMemo(() => {
    const years = new Set<number>();
    let hasOther = false;
    modules.forEach((module) => {
      if (typeof module.moduleYear === "number" && module.moduleYear > 0) {
        years.add(module.moduleYear);
      } else {
        hasOther = true;
      }
    });
    return {
      yearOptions: Array.from(years).sort((a, b) => a - b),
      hasOtherGroups: hasOther,
    };
  }, [modules]);

  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    setSelectedYear((prev) => {
      if (prev && prev !== "other") {
        const prevNum = Number(prev);
        if (!Number.isNaN(prevNum) && yearOptions.includes(prevNum)) {
          return prev;
        }
      }
      if (prev === "other" && hasOtherGroups) {
        return prev;
      }
      if (yearOptions.length > 0) {
        return String(yearOptions[0]);
      }
      if (hasOtherGroups) {
        return "other";
      }
      return null;
    });
  }, [yearOptions, hasOtherGroups]);

  const filteredModules = useMemo(() => {
    if (!selectedYear) return modules;
    if (selectedYear === "other") {
      return modules.filter(
        (module) =>
          typeof module.moduleYear !== "number" || module.moduleYear <= 0,
      );
    }
    const targetYear = Number(selectedYear);
    if (Number.isNaN(targetYear)) return modules;
    return modules.filter((module) => module.moduleYear === targetYear);
  }, [modules, selectedYear]);

  const showYearFilter =
    (yearOptions.length > 0 || hasOtherGroups) && modules.length > 0;

  const handleOpenServer = (serverId: string) => {
    router.push(`/dashboard/server/${serverId}`);
  };

  const renderContent = () => {
    if (!moduleFilters) {
      if (sessionPending) {
        return (
          <SliderShell
            sliderRef={defaultSliderRef}
            onScrollLeft={() => scrollDefaultSlider("left")}
            onScrollRight={() => scrollDefaultSlider("right")}
            disableControls
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <ModuleCardSkeleton key={`module-skeleton-${index}`} />
            ))}
          </SliderShell>
        );
      }
      return (
        <Card className="border-border/60">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-5 w-5" />
              <CardTitle className="text-base">
                Add your degree to see modules
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your profile with a degree and start year to view your
              university modules.
            </p>
          </CardHeader>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <SliderShell
          sliderRef={loadingSliderRef}
          onScrollLeft={() => scrollLoadingSlider("left")}
          onScrollRight={() => scrollLoadingSlider("right")}
          disableControls
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <ModuleCardSkeleton key={`module-skeleton-${index}`} />
          ))}
        </SliderShell>
      );
    }

    if (isError) {
      return (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Unable to load modules
            </CardTitle>
            <p className="text-sm text-destructive/80">
              {error?.message ?? "Please try again in a moment."}
            </p>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (modules.length === 0) {
      return (
        <Card className="border-border/60">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-5 w-5" />
              <CardTitle className="text-base">
                No modules available yet
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Create a server to start organising university modules and
              channels.
            </p>
          </CardHeader>
          <CardFooter>
            <Button variant="secondary" className="gap-2" disabled>
              Create server (coming soon)
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <>
        {showYearFilter ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 shrink-0 text-xs font-medium text-muted-foreground">
              Academic year:
            </span>
            {yearOptions.map((year) => {
              const accent = getYearAccent(year);
              const isActive = selectedYear === String(year);
              return (
                <button
                  key={`year-pill-${year}`}
                  type="button"
                  onClick={() => setSelectedYear(String(year))}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? accent.activePill
                      : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  Year {year}
                </button>
              );
            })}
            {hasOtherGroups ? (
              <button
                type="button"
                onClick={() => setSelectedYear("other")}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selectedYear === "other"
                    ? "border-transparent bg-slate-500 text-white shadow-sm"
                    : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                Other
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredModules.length === 0 ? (
          <Card className="border-border/60">
            <CardHeader className="gap-3">
              <CardTitle className="text-base">
                No modules for this year
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Try choosing a different year to see available modules.
              </p>
            </CardHeader>
          </Card>
        ) : (
          <SliderShell
            sliderRef={resultsSliderRef}
            onScrollLeft={() => scrollResultsSlider("left")}
            onScrollRight={() => scrollResultsSlider("right")}
          >
            {filteredModules.map((module) => {
              const accent = getYearAccent(module.moduleYear);
              const updatedAt = module.updatedAt ?? module.createdAt;
              const formattedDate = updatedAt
                ? new Date(updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              return (
                <Card
                  key={module.id}
                  role="group"
                  tabIndex={0}
                  className="flex min-w-[300px] max-w-[340px] flex-shrink-0 snap-start flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {/* Year-coloured accent strip */}
                  <div className={cn("h-1.5 w-full shrink-0", accent.strip)} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            accent.icon,
                          )}
                        >
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-xs font-semibold uppercase tracking-[0.2em]",
                              module.moduleYear && module.moduleYear > 0
                                ? accent.label
                                : "text-muted-foreground",
                            )}
                          >
                            {module.moduleYear && module.moduleYear > 0
                              ? `Year ${module.moduleYear}`
                              : "Module"}
                          </p>
                          <CardTitle className="mt-0.5 line-clamp-2 text-base font-bold leading-snug">
                            {module.name}
                          </CardTitle>
                        </div>
                      </div>
                      {module.type ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 capitalize"
                        >
                          {module.type.replace(/-/g, " ")}
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pb-3">
                    <p className="line-clamp-1 text-sm capitalize text-muted-foreground">
                      {module.slug.replace(/-/g, " ")}
                    </p>
                    {formattedDate ? (
                      <p className="mt-2 text-xs text-muted-foreground/60">
                        Updated {formattedDate}
                      </p>
                    ) : null}
                  </CardContent>

                  <CardFooter className="border-t border-border/40 pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleOpenServer(module.id)}
                      className="ml-auto gap-1.5"
                    >
                      Open module
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </SliderShell>
        )}

        {hasNextPage ? (
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
                "Load more modules"
              )}
            </Button>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            University modules
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            Jump back into your modules
          </h2>
          <p className="text-sm text-muted-foreground">
            All of your module servers are listed here. Pick one to catch up on
            announcements, assignments, and collaborative channels.
          </p>
        </div>
      </div>
      {renderContent()}
    </section>
  );
}

function ModuleCardSkeleton() {
  return (
    <Card className="min-w-[300px] max-w-[340px] flex-shrink-0 snap-start overflow-hidden border-border/50">
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
        <Skeleton className="h-3 w-24" />
      </CardContent>
      <CardFooter className="border-t border-border/40 pt-3">
        <Skeleton className="ml-auto h-8 w-28" />
      </CardFooter>
    </Card>
  );
}

type SliderShellProps = {
  children: React.ReactNode;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  disableControls?: boolean;
};

function SliderShell({
  children,
  sliderRef,
  onScrollLeft,
  onScrollRight,
  disableControls = false,
}: SliderShellProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onScrollLeft}
          disabled={disableControls}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onScrollRight}
          disabled={disableControls}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={sliderRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
      >
        {children}
      </div>
    </div>
  );
}
