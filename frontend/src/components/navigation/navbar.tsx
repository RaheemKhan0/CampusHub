import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { ArrowRight } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Campus Hub
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how"
            className="text-muted-foreground hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="#faq"
            className="text-muted-foreground hover:text-foreground"
          >
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/login">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1">
            <Link href="/signup">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
