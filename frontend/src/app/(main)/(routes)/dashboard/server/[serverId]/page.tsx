"use client";

import { useParams } from "next/navigation";
import { AlertTriangle, Share2 } from "lucide-react";

import { useServer } from "@/hooks/servers/useServer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ServerPage() {
  const { serverId: rawServerId } = useParams<{ serverId: string }>();
  const serverId = Array.isArray(rawServerId) ? rawServerId[0] : rawServerId;

  const {
    data: server,
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
          Explore modules on the dashboard to get started.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ServerPageSkeleton />;
  }

  if (isError || !server) {
    return (
      <ErrorState
        message={
          error?.message ??
          "We couldn’t find that module. It may have been removed or you no longer have access."
        }
        onRetry={() => refetch()}
        isLoading={isFetching}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <Card className="border-border/60">
        <CardHeader className="space-y-3">
          <CardDescription className="text-xs uppercase tracking-[0.3em] text-primary/70">
            University module
          </CardDescription>
          <CardTitle className="text-3xl">{server.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Stay aligned with your classmates by following announcements, assignments, and
            discussions in this module’s channels.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="uppercase tracking-wide">
              #{server.slug}
            </Badge>
            {server.type && (
              <Badge variant="secondary" className="capitalize">
                {server.type.replace(/-/g, " ")}
              </Badge>
            )}
            {server.degreeId && (
              <Badge variant="outline" className="font-mono">
                Degree ID: {server.degreeId}
              </Badge>
            )}
            {server.degreeModuleId && (
              <Badge variant="outline" className="font-mono">
                Module ID: {server.degreeModuleId}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share module link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ServerPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-8">
      <Skeleton className="h-44 w-full rounded-3xl" />
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
