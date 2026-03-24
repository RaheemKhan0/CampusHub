"use client";

import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { useServer } from "@/hooks/servers/useServer";
import { ServerWelcome } from "@/components/messages/server-welcome";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ServerPage() {
  const { serverId: rawServerId } = useParams<{ serverId: string }>();
  const serverId = Array.isArray(rawServerId) ? rawServerId[0] : rawServerId;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useServer(serverId, {
    enabled: Boolean(serverId),
    retry: 1,
  });

  if (!serverId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Select a server from the sidebar to continue.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ServerPageSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? "We couldn't load this server."}
        onRetry={() => refetch()}
        isLoading={isFetching}
      />
    );
  }

  if (!data) {
    return (
      <ErrorState
        message="We couldn’t find that server. It may have been removed or you no longer have access."
        onRetry={() => refetch()}
        isLoading={isFetching}
      />
    );
  }

  return (
    <ServerWelcome
      serverName={data.name}
      description={`Explore channels in ${data.name} to start collaborating.`}
    />
  );
}

function ServerPageSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-6 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-6"
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
