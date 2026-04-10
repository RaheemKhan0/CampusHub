"use client";

import {
  ArrowRight,
  BookOpen,
  LogOut,
  MessageSquareText,
  UniversityIcon,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UniversityModulesSection } from "./university-modules";
import { SocietyServersSection } from "./society-servers";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function DashboardWelcome() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-10">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UniversityIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
                  Campus Hub Dashboard
                </p>
                <p className="text-xs text-muted-foreground">
                  City University London
                </p>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Welcome back — your community is here.
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Pick up where you left off. Your module servers, classmates, and
              conversations are all in one place. Select a channel from the
              sidebar or jump straight into a module below.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button className="gap-2" size="sm">
                Browse modules
                <ArrowRight className="h-4 w-4" />
              </Button>
              <NotificationBell />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-12 hidden size-44 rounded-full bg-primary/20 blur-3xl md:block" />
      </section>

      {/* ── University modules ───────────────────────────────────────── */}
      <UniversityModulesSection />

      {/* ── Society servers ──────────────────────────────────────────── */}
      <SocietyServersSection />

      {/* ── Snapshot cards ──────────────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        <SnapshotCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Module channels"
          value="Stay on top of your courses"
          description="Jump into lecture, seminar, and assignment channels. Catch up on announcements and share notes with your cohort."
        />
        <SnapshotCard
          icon={<Users className="h-5 w-5" />}
          label="Societies"
          value="Find your community"
          description="Society servers for sports clubs, academic groups, and student interests are on the way."
          comingSoon
        />
        <SnapshotCard
          icon={<MessageSquareText className="h-5 w-5" />}
          label="Real-time chat"
          value="Talk to your course"
          description="Every channel supports live messaging. Ask a quick question or share a resource without leaving the platform."
        />
      </section>

      {/* ── Tips ────────────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Getting the most out of Campus Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <TipItem
            title="Use your module servers"
            body="Each module has dedicated channels — Q&A, resources, and general chat. Jump in, ask questions, and share notes with your cohort."
          />
          <TipItem
            title="Never miss an announcement"
            body="Enable notifications so you get pinged when a classmate or lecturer posts something important in your channels."
          />
          <TipItem
            title="Societies are coming soon"
            body="We're building out society servers next — sports clubs, academic societies, and more. Watch this space."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Snapshot card ────────────────────────────────────────────────────────────

type SnapshotCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  comingSoon?: boolean;
};

function SnapshotCard({
  icon,
  label,
  value,
  description,
  comingSoon,
}: SnapshotCardProps) {
  return (
    <Card className="border-border/60 transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-3 px-5 py-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
            </span>
            {label}
          </div>
          {comingSoon && (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[0.62rem] font-medium text-muted-foreground">
              Soon
            </span>
          )}
        </div>
        <Separator className="opacity-60" />
        <p className="text-base font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Tip item ─────────────────────────────────────────────────────────────────

type TipItemProps = {
  title: string;
  body: string;
};

function TipItem({ title, body }: TipItemProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-5 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
