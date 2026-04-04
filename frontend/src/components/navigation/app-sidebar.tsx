"use client";

import { useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Hash, Lock, RefreshCw, UniversityIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { ModeToggle } from "../utilities/modeToggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useServer } from "@/hooks/servers/useServer";
import { useChannels } from "@/hooks/channels/useChannels";

type ChannelView = {
  id: string;
  name: string;
  type: string;
  serverId: string;
};

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const params = useParams<{ serverId?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const isHomeDashboard = pathname === "/dashboard";
  const serverIdParam = params?.serverId;
  const serverId = Array.isArray(serverIdParam)
    ? serverIdParam[0]
    : serverIdParam;
  const viewingServer = pathname?.includes("/dashboard/server/");

  const {
    data: server,
    isLoading: serverLoading,
  } = useServer(serverId ?? undefined, {
    enabled: Boolean(serverId) && viewingServer,
  });

  const {
    data: channelData,
    isLoading: channelsLoading,
    isError: channelsError,
    error: channelsErrorData,
    refetch: refetchChannels,
  } = useChannels(serverId ?? undefined, undefined, {
    enabled: Boolean(serverId) && viewingServer,
  });

  const publicChannels = useMemo(
    () => channelData?.publicChannels ?? [],
    [channelData],
  );
  const privateChannels = useMemo(
    () => channelData?.privateChannels ?? [],
    [channelData],
  );

  const renderChannelList = ({
    title,
    channels,
  }: {
    title: string;
    channels: ChannelView[];
  }) => {
    if (!channels.length) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span>{title}</span>
          <Badge variant="secondary">{channels.length}</Badge>
        </div>
        <ul className="space-y-1 px-2">
          {channels.map((channel) => (
            <li key={channel.id}>
              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/dashboard/server/${channel.serverId}/channel/${channel.id}`,
                  );
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {channel.type === "private" ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="truncate">{channel.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const bodyContent = () => {
    if (!viewingServer || !serverId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <UniversityIcon className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a module from the dashboard to see its channels here.
          </p>
        </div>
      );
    }

    if (serverLoading || channelsLoading) {
      return (
        <div className="space-y-4 px-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      );
    }

    if (channelsError) {
      return (
        <div className="space-y-3 px-3">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-semibold">Unable to load channels.</p>
            <p className="text-xs text-destructive/80">
              {channelsErrorData?.message ?? "Please try again."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => refetchChannels()}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (!publicChannels.length && !privateChannels.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <p className="text-sm text-muted-foreground">
            No channels exist for this module yet. Create one from the module actions.
          </p>
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-5 overflow-y-auto">
        {renderChannelList({ title: "Public channels", channels: publicChannels })}
        {renderChannelList({ title: "Private channels", channels: privateChannels })}
      </div>
    );
  };

  const handleNavigateHome = () => {
    router.push("/dashboard");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className={cn("flex-shrink-0 border-r border-border/40 dark:bg-[#121212]")}>
      <SidebarHeader className="border-b border-border/40">
        <button
          type="button"
          onClick={handleNavigateHome}
          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-1 py-1 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UniversityIcon className="h-5 w-5" />
          </span>
          <div className="text-left leading-tight">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Campus Hub
            </p>
            <p className="text-base font-semibold text-foreground">
              {server?.name ?? "Home dashboard"}
            </p>
          </div>
        </button>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <SidebarGroup className="flex-1 px-0">{bodyContent()}</SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex w-full items-center justify-center">
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
