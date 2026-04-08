"use client";

import { Bell, BookOpen, HelpCircle } from "lucide-react";

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
    <div className="flex h-full flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <header className="space-y-3">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-primary/10 text-primary">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome to {serverName}
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          {description ??
            `You're in ${serverName}. Pick a channel from the sidebar to start reading, sharing resources, or asking questions with your cohort.`}
        </p>
      </header>

      <Card className="w-full max-w-2xl border-border/60 bg-background/80 shadow-sm">
        <CardContent className="grid gap-6 px-8 py-8 md:grid-cols-3">
          <Blurb
            icon={BookOpen}
            title="Share resources"
            description="Drop lecture notes, past papers, and useful links in resource channels so your whole cohort benefits."
          />
          <Separator className="hidden md:block" orientation="vertical" />
          <Blurb
            icon={HelpCircle}
            title="Ask & answer"
            description="Post questions in the Q&A channel and get help from classmates and teaching staff directly."
          />
          <Separator className="hidden md:block" orientation="vertical" />
          <Blurb
            icon={Bell}
            title="Stay in the loop"
            description="Keep an eye on the announcements channel for deadline reminders, updates, and important notices."
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
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
