"use client";

import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Hash, MessageSquareText, HelpCircle } from "lucide-react";

import { useServer } from "@/hooks/servers/useServer";
import { useChannels } from "@/hooks/channels/useChannels";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SERVER_TYPE_LABELS: Record<string, string> = {
  unimodules: "University Module",
  citysocieties: "City Society",
  personal: "Personal Server",
};

export default function ServerPage() {
  const { serverId: rawServerId } = useParams<{ serverId: string }>();
  const serverId = Array.isArray(rawServerId) ? rawServerId[0] : rawServerId;
  const router = useRouter();

  const {
    data: server,
    isLoading: serverLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useServer(serverId, {
    enabled: Boolean(serverId),
    retry: 1,
  });

  const { data: channelData, isLoading: channelsLoading } = useChannels(
    serverId,
    undefined,
    { enabled: Boolean(serverId) },
  );

  const publicChannels = channelData?.publicChannels ?? [];
  const firstChannel = publicChannels[0];

  if (!serverId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Select a module from the dashboard to get started.
        </p>
      </div>
    );
  }

  if (serverLoading || channelsLoading) {
    return <ServerPageSkeleton />;
  }

  if (isError || !server) {
    return (
      <ErrorState
        message={
          error?.message ??
          "We couldn't find that server. It may have been removed or you no longer have access."
        }
        onRetry={() => refetch()}
        isLoading={isFetching}
      />
    );
  }

  const typeLabel =
    SERVER_TYPE_LABELS[server.type ?? ""] ?? server.type ?? "Server";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">

      {/* ── Server hero ──────────────────────────────────────────────── */}
      <Card className="relative overflow-hidden border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <CardHeader className="relative space-y-3">
          <CardDescription className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            {typeLabel}
          </CardDescription>
          <CardTitle className="text-3xl font-bold">{server.name}</CardTitle>
          <p className="max-w-xl text-sm text-muted-foreground">
            Stay aligned with your classmates — follow announcements, share
            resources, and ask questions in this{" "}
            {typeLabel.toLowerCase()}&apos;s channels.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="uppercase tracking-wide">
              #{server.slug}
            </Badge>
            {server.type && (
              <Badge variant="secondary" className="capitalize">
                {typeLabel}
              </Badge>
            )}
            {typeof server.moduleYear === "number" &&
              server.moduleYear > 0 && (
                <Badge variant="outline">Year {server.moduleYear}</Badge>
              )}
          </div>
        </CardHeader>
        <CardContent className="relative">
          {firstChannel ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={() =>
                router.push(
                  `/dashboard/server/${serverId}/channel/${firstChannel.id}`,
                )
              }
            >
              <Hash className="h-3.5 w-3.5" />
              Open #{firstChannel.name}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a channel from the sidebar to start.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Channel guide ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GuideCard
          icon={<MessageSquareText className="h-5 w-5" />}
          title="Text channels"
          description="General discussion, resource sharing, and live chat with classmates and staff. Pick any # channel in the sidebar to jump in."
        />
        <GuideCard
          icon={<HelpCircle className="h-5 w-5" />}
          title="Q&A channels"
          description="Post questions and get answers from your cohort or teaching staff. Dedicated Q&A channels keep discussions easy to follow."
        />
      </div>
    </div>
  );
}

// ─── Guide card ───────────────────────────────────────────────────────────────

type GuideCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function GuideCard({ icon, title, description }: GuideCardProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex gap-4 px-5 py-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ServerPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <Card className="border-border/60">
        <CardHeader className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-2/3 max-w-sm" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-36 rounded-md" />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  isLoading?: boolean;
};

function ErrorState({ message, onRetry, isLoading }: ErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md space-y-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-destructive/90">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isLoading}
            className={cn("gap-2", isLoading && "opacity-70")}
          >
            {isLoading ? "Retrying…" : "Try again"}
          </Button>
        )}
      </div>
    </div>
  );
}
