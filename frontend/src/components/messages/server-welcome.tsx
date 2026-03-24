"use client";

import { Compass, FolderOpenDot, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type ServerWelcomeProps = {
  serverName: string;
  description?: string;
  onBrowseChannels?: () => void;
  actionLabel?: string;
};

export function ServerWelcome({
  serverName,
  description,
  onBrowseChannels,
  actionLabel = "Browse channels",
}: ServerWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 px-6 py-12 text-center">
      <header className="space-y-3">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome to {serverName}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          {description ??
            `Pick a channel to dive into updates, resources, and conversations happening in ${serverName}.`}
        </p>
      </header>

      <Card className="w-full max-w-2xl border-border/60 bg-background/80 shadow-sm">
        <CardContent className="grid gap-6 px-8 py-10 md:grid-cols-3">
          <Blurb
            icon={FolderOpenDot}
            title="Organized spaces"
            description="Each channel keeps discussions focused on a topic or module."
          />
          <Separator className="hidden md:block" orientation="vertical" />
          <Blurb
            icon={Users}
            title="Collaborate quickly"
            description="Meet classmates, teachers, or teammates where they’re already talking."
          />
          <Separator className="hidden md:block" orientation="vertical" />
          <Blurb
            icon={Compass}
            title="Find your flow"
            description="Hop between channels to keep up with everything happening in this server."
          />
        </CardContent>
      </Card>

      {onBrowseChannels && (
        <Button size="lg" className="gap-2" onClick={onBrowseChannels}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

type BlurbProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

function Blurb({ icon: Icon, title, description }: BlurbProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
