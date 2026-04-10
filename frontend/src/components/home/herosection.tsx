import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  MessageSquareText,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeroCTA } from "./hero-cta";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            City University London
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Your university.
            <br />
            Your community.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Campus Hub connects City University students to their degree
            modules, student societies, and classmates — all through organised
            channels and real-time chat.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <HeroCTA />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Requires a valid <span className="font-medium">@city.ac.uk</span> student email.
          </p>
        </div>

        {/* Feature preview card */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                  Campus Hub
                </p>
                <CardTitle className="text-sm">
                  CS3072 — Algorithms &amp; Data Structures
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Separator />
            <div className="space-y-2.5 text-sm">
              {PREVIEW_MESSAGES.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.isOwn ? "justify-end" : ""}`}
                >
                  {!msg.isOwn && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6rem] font-bold uppercase text-muted-foreground">
                      {msg.initials}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      msg.isOwn
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted/70 text-foreground"
                    }`}
                  >
                    {!msg.isOwn && (
                      <p className="mb-0.5 text-[0.65rem] font-semibold text-foreground/70">
                        {msg.name}
                      </p>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground/50">
              Message #general…
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            What's included
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Everything your cohort needs
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {f.desc}
                {f.badge && (
                  <span className="ml-2 inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                    {f.badge}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section
        id="how"
        className="mx-auto max-w-6xl border-t border-border/40 px-6 py-16"
      >
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            Getting started
          </p>
          <h2 className="mt-2 text-2xl font-bold">Up and running in minutes</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-xs font-bold text-muted-foreground">
                {s.n}
              </div>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="mx-auto max-w-6xl border-t border-border/40 px-6 py-16"
      >
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">Common questions</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {FAQ.map((f) => (
            <Card key={f.q} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{f.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Campus Hub. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PREVIEW_MESSAGES = [
  {
    id: 1,
    name: "Aisha K.",
    initials: "AK",
    text: "Has anyone started the week 4 problem sheet yet?",
    isOwn: false,
  },
  {
    id: 2,
    name: "",
    initials: "",
    text: "Just finished Q1–3. Happy to share my working if useful!",
    isOwn: true,
  },
  {
    id: 3,
    name: "Marcus T.",
    initials: "MT",
    text: "That would be great — struggling with the recursion part 🙏",
    isOwn: false,
  },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Module communities",
    desc: "Every degree module gets its own server with channels for Q&A, lecture notes, assignments, and general chat.",
    badge: undefined,
  },
  {
    icon: Users,
    title: "Student societies",
    desc: "Society servers for sports clubs, academic groups, and student interest communities are coming soon.",
    badge: "Coming soon",
  },
  {
    icon: MessageSquareText,
    title: "Real-time messaging",
    desc: "Chat with your course in real time. Ask questions, share resources, and keep the conversation going — all in one place.",
    badge: undefined,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Sign up with your City email",
    desc: "Register using your @city.ac.uk address. This verifies your student status and ties you to the right degree programme.",
  },
  {
    n: "02",
    title: "Get matched to your modules",
    desc: "Your degree and start year automatically unlock the module servers relevant to your courses — no manual searching needed.",
  },
  {
    n: "03",
    title: "Join the conversation",
    desc: "Browse channels, post questions, share resources, and connect with classmates and teaching staff in real time.",
  },
];

const FAQ = [
  {
    q: "Who can use Campus Hub?",
    a: "Any student enrolled at City University of London with a valid @city.ac.uk email address.",
  },
  {
    q: "What are module servers?",
    a: "Each university module gets a dedicated server with channels for Q&A, resources, announcements, and general discussion — keeping everything for that module in one place.",
  },
  {
    q: "When are society servers available?",
    a: "Society servers are actively in development. Sports clubs, academic societies, and other student groups will get their own spaces very soon.",
  },
  {
    q: "Is Campus Hub free?",
    a: "Yes — Campus Hub is completely free for all City University students. No subscriptions, no fees.",
  },
];
