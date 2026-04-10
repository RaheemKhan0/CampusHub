"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  BookOpen,
  Hash,
  Lock,
  RefreshCw,
  UniversityIcon,
  Plus,
  Trash2,
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServer } from "@/hooks/servers/useServer";
import { useChannels } from "@/hooks/channels/useChannels";
import { useMyServerRole } from "@/hooks/servers/useMyServerRole";
import { useCreateChannel } from "@/hooks/channels/useCreateChannel";
import { useDeleteChannel } from "@/hooks/channels/useDeleteChannel";

type ChannelView = {
  id: string;
  name: string;
  type: string;
  serverId: string;
};

type CreateForm = {
  name: string;
  type: "text" | "qa";
  privacy: "public" | "hidden";
};

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const params = useParams<{ serverId?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const serverIdParam = params?.serverId;
  const serverId = Array.isArray(serverIdParam)
    ? serverIdParam[0]
    : serverIdParam;
  const viewingServer = pathname?.includes("/dashboard/server/");

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: "",
    type: "text",
    privacy: "public",
  });

  const activeChannelId = useMemo(() => {
    const match = pathname?.match(/\/channel\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const { data: server, isLoading: serverLoading } = useServer(
    serverId ?? undefined,
    { enabled: Boolean(serverId) && viewingServer },
  );

  const {
    data: channelData,
    isLoading: channelsLoading,
    isError: channelsError,
    error: channelsErrorData,
    refetch: refetchChannels,
  } = useChannels(serverId ?? undefined, undefined, {
    enabled: Boolean(serverId) && viewingServer,
  });

  const { data: roleData } = useMyServerRole(
    viewingServer ? serverId : undefined,
  );

  const canManage = useMemo(() => {
    const roles = roleData?.roles ?? [];
    return roles.includes("owner") || roles.includes("admin");
  }, [roleData]);

  const createChannel = useCreateChannel(serverId ?? "");
  const deleteChannel = useDeleteChannel(serverId ?? "");

  const publicChannels = useMemo(
    () => channelData?.publicChannels ?? [],
    [channelData],
  );
  const privateChannels = useMemo(
    () => channelData?.privateChannels ?? [],
    [channelData],
  );

  const totalChannels = publicChannels.length + privateChannels.length;

  const handleCreate = async () => {
    if (!form.name.trim() || !serverId) return;
    await createChannel.mutateAsync({
      name: form.name.trim(),
      type: form.type,
      privacy: form.privacy,
    });
    setForm({ name: "", type: "text", privacy: "public" });
    setAddOpen(false);
  };

  const handleDelete = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChannel.mutate(channelId);
  };

  const renderChannelList = ({
    title,
    channels,
  }: {
    title: string;
    channels: ChannelView[];
  }) => {
    if (!channels.length) return null;

    return (
      <div className="space-y-0.5">
        {/* Section header */}
        <div className="flex items-center gap-2 px-3 pb-1 pt-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-muted-foreground/50">
            {title}
          </span>
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[0.62rem] tabular-nums text-muted-foreground/40">
            {channels.length}
          </span>
        </div>

        <ul className="space-y-0.5 px-2">
          {channels.map((channel) => {
            const isActive = activeChannelId === channel.id;
            return (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/dashboard/server/${channel.serverId}/channel/${channel.id}`,
                    );
                    if (isMobile) setOpenMobile(false);
                  }}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md border-l-2 py-1.5 pl-2.5 pr-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-transparent text-muted-foreground hover:border-primary/20 hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {channel.type === "private" ? (
                    <Lock
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground/50 group-hover:text-muted-foreground",
                      )}
                    />
                  ) : (
                    <Hash
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground/50 group-hover:text-muted-foreground",
                      )}
                    />
                  )}
                  <span className="truncate flex-1">{channel.name}</span>
                  {canManage && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDelete(channel.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleDelete(channel.id, e as unknown as React.MouseEvent);
                      }}
                      className={cn(
                        "ml-auto hidden h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive group-hover:flex",
                        deleteChannel.isPending && "pointer-events-none opacity-40",
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const bodyContent = () => {
    if (!viewingServer || !serverId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground/70">
              No module selected
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/70">
              Pick a module from the dashboard to browse its channels.
            </p>
          </div>
        </div>
      );
    }

    if (serverLoading || channelsLoading) {
      return (
        <div className="space-y-3 px-3 pt-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-16" />
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {[null, null, null, null].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
          <div className="flex items-center gap-2 pt-3">
            <Skeleton className="h-2.5 w-20" />
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {[null, null].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      );
    }

    if (channelsError) {
      return (
        <div className="space-y-3 px-3 pt-3">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-semibold">Unable to load channels</p>
            <p className="mt-0.5 text-xs text-destructive/80">
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
        <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20">
            <Hash className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            No channels yet for this module.
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add channel
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-1 overflow-y-auto py-1">
        {renderChannelList({ title: "Public channels", channels: publicChannels })}
        {renderChannelList({ title: "Private channels", channels: privateChannels })}
      </div>
    );
  };

  const handleNavigateHome = () => {
    router.push("/dashboard");
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <Sidebar
        className={cn(
          "flex-shrink-0 border-r border-border/40 dark:bg-[#121212]",
        )}
      >
        <SidebarHeader className="border-b border-border/40 pb-3">
          <button
            type="button"
            onClick={handleNavigateHome}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UniversityIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 text-left leading-tight">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-primary/60">
                Campus Hub
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {server?.name ?? "Home dashboard"}
              </p>
            </div>
          </button>
        </SidebarHeader>

        <SidebarContent className="flex flex-col">
          <SidebarGroup className="flex-1 px-0">{bodyContent()}</SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/40">
          <div className="flex w-full items-center justify-between px-1">
            {viewingServer && totalChannels > 0 ? (
              <p className="text-xs text-muted-foreground/50">
                {totalChannels} channel{totalChannels !== 1 ? "s" : ""}
              </p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {canManage && viewingServer && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                  onClick={() => setAddOpen(true)}
                  title="Add channel"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <ModeToggle />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ch-name">Name</Label>
              <Input
                id="ch-name"
                placeholder="e.g. announcements"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex gap-2">
                {(["text", "qa"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-sm capitalize transition-colors",
                      form.type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Privacy</Label>
              <div className="flex gap-2">
                {(["public", "hidden"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, privacy: p }))}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-sm capitalize transition-colors",
                      form.privacy === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim() || createChannel.isPending}
              onClick={handleCreate}
            >
              {createChannel.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
