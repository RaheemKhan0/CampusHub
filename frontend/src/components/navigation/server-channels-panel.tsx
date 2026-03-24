"use client";

import { LucideArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChannels } from "@/hooks/channels/useChannels";
import type { components } from "@/types/openapi";
import { useParams, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionTrigger,
  AccordionContent,
  AccordionItem,
} from "../ui/accordion";

type ChannelView = components["schemas"]["ChannelViewDto"];

type ServerChannelsPanelProps = {
  serverId?: string | null;
  serverName?: string;
  open: boolean;
  onClose: () => void;
};

export function ServerChannelsPanel({
  serverId,
  serverName,
  open,
  onClose,
}: ServerChannelsPanelProps) {
  const { data, isLoading, isError, error } = useChannels(
    serverId ?? undefined,
    undefined,
    {
      enabled: Boolean(serverId) && open,
    },
  );

  const publicChannels = data?.publicChannels ?? [];
  const privateChannels = data?.privateChannels ?? [];

  return (
    <div
      className={cn(
        "sticky top-0 flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
        open ? "w-[300px] max-w-[300px]" : "w-0",
      )}
    >
      <div
        className={cn(
          "flex h-screen flex-col border-l border-border/40 bg-sidebar text-sidebar-foreground shadow-lg",
          "overflow-y-auto transition-[transform,opacity] duration-300 ease-out",
          "w-[--panel-width] min-w-[--panel-width] max-w-[--panel-width]",
          open
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-4 opacity-0",
        )}
      >
        <header className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground/70">
              Server Channels
            </p>
            <h2 className="text-base font-semibold text-foreground mt-2">
              {serverName ?? "Select a server"}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 absolute top-3 right-3"
            onClick={onClose}
          >
            <LucideArrowLeft className="h-5 w-5" />
            <span className="sr-only">Close channels panel</span>
          </Button>
        </header>
        <Separator />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <ChannelSkeleton />
          ) : isError ? (
            <ErrorState message={error?.message} />
          ) : publicChannels.length === 0 && privateChannels.length === 0 ? (
            <EmptyState />
          ) : (
            <Accordion
              type="multiple"
              defaultValue={[
                ...(publicChannels.length ? ["public"] : []),
                ...(privateChannels.length ? ["private"] : []),
              ]}
              className="space-y-3"
            >
              <ChannelSection
                value="public"
                title="Public Channels"
                channels={publicChannels}
              />
              <ChannelSection
                value="private"
                title="Private Channels"
                channels={privateChannels}
              />
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}

type ChannelSectionProps = {
  value: string;
  title: string;
  channels: ChannelView[];
};

function ChannelSection({ value, title, channels }: ChannelSectionProps) {
  const router = useRouter();
  const params = useParams<{ serverId: string; channelId?: string }>();
  const activeChannelId = Array.isArray(params?.channelId)
    ? params?.channelId[0]
    : params?.channelId;

  if (channels.length === 0) return null;

  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-lg border border-border/40 bg-background/60"
    >
      <AccordionTrigger className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{title}</span>
        <span className="ml-auto text-[0.7rem] font-normal text-muted-foreground/80">
          {channels.length}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <ul className="space-y-1 px-2 py-2">
          {channels.map((channel) => {
            const isActive = activeChannelId === channel.id;

            return (
              <li key={channel.id}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() =>
                    router.push(
                      `/dashboard/server/${channel.serverId}/channel/${channel.id}`,
                    )
                  }
                  className={cn(
                    "group flex w-full flex-col gap-1 rounded-md border border-transparent px-3 py-2 text-left transition-colors",
                    "bg-background/70 hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isActive && "border-primary/70 bg-primary/10 text-primary",
                  )}
                >
                  <span className="truncate font-medium">{channel.name}</span>
                  <span className="text-xs uppercase text-muted-foreground group-hover:text-muted-foreground/80">
                    {channel.type}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

function ChannelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-4 text-sm text-destructive">
      <p className="font-medium">Failed to load channels.</p>
      {message && <p className="text-destructive/80">{message}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-border/40 bg-background/80 px-3 py-4 text-sm text-muted-foreground">
      No channels yet.
    </div>
  );
}
