"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteServers } from "@/hooks/servers/useInfiniteServers";
import type { components } from "@/types/openapi";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SCROLL_OFFSET_PX = 48;

type ServerView = components["schemas"]["ServerViewDto"];

type ServerAccordionProps = {
  className?: string;
  activeServerId?: string | null;
  onServerSelect?: (server: ServerView) => void;
};

export function ServerAccordion({
  className,
  activeServerId: controlledActiveId,
  onServerSelect,
}: ServerAccordionProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    controlledActiveId ?? null,
  );

  useEffect(() => {
    if (controlledActiveId !== undefined) {
      setInternalActiveId(controlledActiveId);
    }
  }, [controlledActiveId]);

  const activeServerId = controlledActiveId ?? internalActiveId;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteServers();

  const servers = useMemo<ServerView[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);


  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;

      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom <= SCROLL_OFFSET_PX) {
        fetchNextPage();
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleServerClick = useCallback(
    (server: ServerView) => {
      setInternalActiveId(server.id);
      onServerSelect?.(server);
    },
    [onServerSelect],
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border border-border/60 bg-muted/30 p-4",
          "flex-[0.6] max-h-[60%]",
          className,
        )}
      >
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
          "flex-[0.6] max-h-[60%]",
          className,
        )}
      >
        <span>Failed to load servers.</span>
        <span className="text-destructive/80">{error.message}</span>
      </div>
    );
  }

  const renderDescription = (server: ServerView) =>
    server.slug.replace(/-/g, " ");

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-border/60 bg-muted/20",
        "flex-[0.6] max-h-[60%]",
        className,
      )}
    >
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Servers
        </h2>
      </div>
      <Separator />
      <TooltipProvider delayDuration={150}>
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-2 py-2 space-y-2"
        >
          {servers.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No servers yet.
            </div>
          ) : (
            servers.map((server) => {
              const isActive = server.id === activeServerId;
              const description = renderDescription(server);

              return (
                <Tooltip key={server.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleServerClick(server)}
                      className={cn(
                        "group flex h-14 w-full flex-col justify-center rounded-md border border-border/40 bg-background/80 px-3 text-left transition-colors",
                        "hover:border-primary/60 hover:bg-background",
                        isActive && "border-primary/80 bg-background",
                      )}
                    >
                      <span className="line-clamp-1 text-sm font-semibold text-foreground">
                        {server.name}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-sm">
                    <p className="font-semibold text-[#E0E0E0] dark:text-black">
                      {server.name}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
          {isFetchingNextPage && (
            <div className="mt-3 flex items-center justify-center text-xs text-muted-foreground">
              Loading more...
            </div>
          )}
        </div>
      </TooltipProvider>
      <Separator />
    </div>
  );
}
