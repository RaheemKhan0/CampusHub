"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Github,
  Chrome,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// If you have an auth client, import the browser-safe module
// import { authClient } from "@/lib/betterauth/client";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<z.input<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),

    defaultValues: { email: "", password: "", remember: false },
    mode: "onChange",
  });

  async function onSubmit(values: z.input<typeof LoginSchema>) {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Example with your auth client
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });
      if (result.error) throw new Error(result.error.message);
      toast.success("Login Successful!");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const message = err instanceof Error ? err.message : "Invalid credentials. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const onInvalid: Parameters<typeof form.handleSubmit>[1] = (errors) => {
    const first = Object.values(errors)[0] as { message?: string };
    toast.error(first?.message ?? "Please fix the errors");
  };

  // OAuth handlers — adjust to your routes/providers
  const onGoogle = () => (window.location.href = "/api/auth/oauth/google");
  const onGithub = () => (window.location.href = "/api/auth/oauth/github");

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-background to-muted px-4 py-10">
      <Card className="w-full max-w-[480px] shadow-lg border-border/60">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Black & white, minimal, and fast.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={onGoogle}
                disabled={submitting}
                className="gap-2"
              >
                <Chrome className="size-4" /> Continue with Google
              </Button>
              <Button
                variant="outline"
                onClick={onGithub}
                disabled={submitting}
                className="gap-2"
              >
                <Github className="size-4" /> Continue with GitHub
              </Button>
            </div>

            <div className="relative py-2">
              <Separator />
              <span className="absolute inset-0 -top-2 mx-auto w-fit bg-card px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              className="grid gap-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="student@city.ac.uk"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPw ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <Link
                        href="/forgot-password"
                        className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        id="remember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="remember"
                      className="font-normal text-sm"
                    >
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}{" "}
                Sign in
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
