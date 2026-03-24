import Link from "next/link";
import { ArrowRight, Check, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// This page is intentionally simple and monochrome (black & white theme)
// so you can iterate quickly. All sections are small, composable blocks.

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
          {/* Hero */}
      <section className="mx-auto min-h-[100vh] grid max-w-6xl grid-cols-1 items-center gap-6 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="space-y-5">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Connecting Platform for Students
          </h1>
          <p className="max-w-prose text-muted-foreground">
            Monochrome UI built with Next.js and shadcn/ui. Replace copy, swap sections, and ship fast.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2">
              <Link href="/signup">Create account <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/login">I already have an account</Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2">
              <Link href="https://github.com/" target="_blank" rel="noreferrer"><Github className="size-4" /> GitHub</Link>
            </Button>
          </div>
        </div>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Preview card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Swap this with a product screenshot, illustration, or KPI card grid.</p>
            <Separator />
            <ul className="grid gap-2">
              {[
                "Fast to scaffold",
                "Accessible components",
                "Black & white by default",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-foreground">
                  <Check className="size-4" /> {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Composable", desc: "Small sections you can reorder or remove." },
            { title: "Consistent", desc: "shadcn/ui primitives with Tailwind tokens." },
            { title: "Clean", desc: "Minimal typography and spacing by default." },
          ].map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Clone", d: "Start from this skeleton and keep what you need." },
            { n: "02", t: "Customize", d: "Edit copy, swap components, plug in your data." },
            { n: "03", t: "Launch", d: "Deploy and iterate. Keep it simple." },
          ].map((s) => (
            <div key={s.n} className="space-y-2">
              <div className="text-xs text-muted-foreground">{s.n}</div>
              <h3 className="text-lg font-medium">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ (placeholder) */}
      <section id="faq" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { q: "Is this production-ready?", a: "It’s a minimal, accessible base. Harden per your needs." },
            { q: "Can I theme it?", a: "Yes—this is monochrome by default. Adjust tokens in Tailwind/shadcn." },
            { q: "Where are components from?", a: "shadcn/ui. Replace or extend freely." },
            { q: "How do I deploy?", a: "Vercel works great for Next.js. Any modern platform is fine." },
          ].map((f) => (
            <Card key={f.q} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">{f.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.a}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Campus Hub. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
