"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function HeroCTA() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (session) {
    return (
      <Button asChild size="lg" className="gap-2">
        <Link href="/dashboard">
          Go to dashboard
          <LayoutDashboard className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg" className="gap-2">
        <Link href="/signup">
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/login">Sign in</Link>
      </Button>
    </>
  );
}
