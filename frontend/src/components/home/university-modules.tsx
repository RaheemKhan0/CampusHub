"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ServerView = components["schemas"]["ServerViewDto"];

export function UniversityModulesSection() {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteServers();

  const modules = useMemo<ServerView[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const handleOpenServer = (serverId: string) => {
    router.push(`/dashboard/server/${serverId}`);
  };

  const scrollSlider = (direction: "left" | "right") => {
    const container = sliderRef.current;
    if (!container) return;
    const offset = direction === "left" ? -container.clientWidth : container.clientWidth;
    container.scrollBy({ left: offset, behavior: "smooth" });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <SliderShell
          sliderRef={sliderRef}
          onScrollLeft={() => scrollSlider("left")}
          onScrollRight={() => scrollSlider("right")}
          disableControls
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={`module-skeleton-${index}`}
              className="min-w-[320px] max-w-[360px] flex-shrink-0 snap-start border-border/50"
            >
              <CardHeader className="gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-32" />
              </CardFooter>
            </Card>
          ))}
        </SliderShell>
      );
    }

    if (isError) {
      return (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Unable to load modules</CardTitle>
            <CardDescription className="text-destructive/80">
              {error?.message ?? "Please try again in a moment."}
            </CardDescription>
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

    if (modules.length === 0) {
      return (
        <Card className="border-border/60">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-5 w-5" />
              <CardTitle className="text-base">No modules available yet</CardTitle>
            </div>
            <CardDescription>
              Create a server to start organising university modules and channels.
            </CardDescription>
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
        <SliderShell
          sliderRef={sliderRef}
          onScrollLeft={() => scrollSlider("left")}
          onScrollRight={() => scrollSlider("right")}
        >
          {modules.map((module) => {
            const updatedAt = module.updatedAt ?? module.createdAt;
            const formattedDate = updatedAt
              ? new Date(updatedAt).toLocaleDateString()
              : "Not available";

            return (
              <Card
                key={module.id}
                role="group"
                tabIndex={0}
                className="min-w-[320px] max-w-[360px] flex-shrink-0 snap-start border-border/60 transition hover:-translate-y-0.5 hover:border-primary/50 focus-visible:-translate-y-0.5 focus-visible:border-primary/60 focus-visible:outline-none"
              >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardDescription className="text-xs uppercase tracking-[0.25em]">
                    Module
                  </CardDescription>
                  <CardTitle className="text-lg font-semibold">{module.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {module.slug.replace(/-/g, " ")}
                  </p>
                </div>
                {module.type ? (
                  <Badge variant="secondary" className="capitalize">
                    {module.type.replace(/-/g, " ")}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Degree">
                  {module.degreeId ? (
                    <span className="font-mono text-xs text-muted-foreground">{module.degreeId}</span>
                  ) : (
                    <span className="text-muted-foreground/70">Not linked</span>
                  )}
                </InfoRow>
                <InfoRow label="Module">
                  {module.degreeModuleId ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {module.degreeModuleId}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">Not assigned</span>
                  )}
                </InfoRow>
                <InfoRow label="Updated">
                  <span className="text-muted-foreground">{formattedDate}</span>
                </InfoRow>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  University module
                </div>
                <Button size="sm" onClick={() => handleOpenServer(module.id)} className="gap-2">
                  View module
                  <ArrowIcon />
                </Button>
              </CardFooter>
            </Card>
            );
          })}
        </SliderShell>
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
                <>
                  Load more modules
                </>
              )}
            </Button>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            University modules
          </p>
          <h2 className="text-2xl font-bold text-foreground">Jump back into your modules</h2>
          <p className="text-sm text-muted-foreground">
            All of your module servers are listed here. Pick one to catch up on announcements,
            assignments, and collaborative channels.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      {renderContent()}
    </section>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

type SliderShellProps = {
  children: React.ReactNode;
  sliderRef: React.RefObject<HTMLDivElement>;
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
