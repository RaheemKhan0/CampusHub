"use client";

import { Sparkles, UsersRound, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type ChannelWelcomeProps = {
  serverName: string;
  channelName?: string;
  description?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
};

export function ChannelWelcome({
  serverName,
  channelName,
  description,
  primaryActionLabel = "Start a conversation",
  onPrimaryAction,
}: ChannelWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 px-6 py-12 text-center">
      <header className="space-y-3">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome to {channelName ? `#${channelName}` : serverName}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          {description ??
            `You’re all set to start collaborating in ${serverName}. Share updates, drop resources, or kick off a Q&A whenever you’re ready.`}
        </p>
      </header>

      <Card className="w-full max-w-2xl border-border/60 bg-background/80 shadow-sm">
        <CardContent className="grid gap-6 px-8 py-10 md:grid-cols-3">
          <WelcomeBlurb
            icon={UsersRound}
            title="Introduce the team"
            description="Let everyone know who’s here and what you’re working on."
          />
          <Separator className="hidden md:block" orientation="vertical" />
          <WelcomeBlurb
            icon={BookOpen}
            title="Pin useful resources"
            description="Gather links, notes, or docs so members can find everything easily."
          />
          <Separator className="hidden md:block" orientation="vertical" />
          <WelcomeBlurb
            icon={Sparkles}
            title="Start the first thread"
            description="Ask a question or share an update to get the conversation going."
          />
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="gap-2"
        onClick={onPrimaryAction}
        disabled={!onPrimaryAction}
      >
        {primaryActionLabel}
      </Button>
    </div>
  );
}

type WelcomeBlurbProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

function WelcomeBlurb({ icon: Icon, title, description }: WelcomeBlurbProps) {
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
