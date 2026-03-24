"use client";

import {
  ArrowRight,
  CalendarRange,
  MessageSquareText,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function DashboardWelcome() {
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
              Campus Hub Dashboard
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Welcome back! Ready to catch up with your communities?
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Select a server on the left to jump into channel conversations, review upcoming
              events, or share an update with your classmates. Everything you need to stay in
              sync lives right here.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button className="gap-2" size="sm">
                Explore messages
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                Create a server
                <UsersRound className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-12 hidden size-44 rounded-full bg-primary/20 blur-3xl md:block" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={<MessageSquareText className="h-5 w-5" />}
          label="Active channels"
          value="Join a conversation"
          description="Pick a server channel to see the latest updates and threads."
        />
        <InsightCard
          icon={<UsersRound className="h-5 w-5" />}
          label="People online"
          value="Collaborate in real time"
          description="Invite classmates to discussions or share resources instantly."
        />
        <InsightCard
          icon={<CalendarRange className="h-5 w-5" />}
          label="Upcoming"
          value="Plan your week"
          description="Track deadlines, workshops, and community events across servers."
        />
      </section>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Quick tips
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <TipItem
            title="Stay in control"
            body="Use the server panel to browse channels, archive old ones, or create a new private space."
          />
          <TipItem
            title="Never miss a beat"
            body="Enable notifications to get pinged when someone tags you or posts in key channels."
          />
          <TipItem
            title="Work smarter together"
            body="Drop files, poll your peers, and keep all module knowledge organised in one place."
          />
        </CardContent>
      </Card>
    </div>
  );
}

type InsightCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
};

function InsightCard({ icon, label, value, description }: InsightCardProps) {
  return (
    <Card className="border-border/60 transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-3 px-5 py-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </span>
          {label}
        </div>
        <Separator className="opacity-60" />
        <p className="text-base font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

type TipItemProps = {
  title: string;
  body: string;
};

function TipItem({ title, body }: TipItemProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-5 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
