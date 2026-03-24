"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Github,
  Chrome,
  ShieldCheck,
  ChevronsUpDown,
  Check,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Checkbox } from "@radix-ui/react-checkbox";
import { useDegrees } from "@/hooks/degrees/useDegrees";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// --- Validation schema
const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a symbol");

const SignupSchema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string(),
    degreeSlug: z.string().min(1, "Select your degree"),
    startYear: z.string().min(1, "Select your start year"),
    agree: z
      .boolean()
      .refine((v) => v, { message: "You must accept the Terms." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// --- Password strength helper
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = ["Very weak", "Weak", "Okay", "Good", "Strong", "Excellent"]; // 0..5
  return { score, label: levels[score] };
}

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [degreeOpen, setDegreeOpen] = React.useState(false);
  const [startYearOpen, setStartYearOpen] = React.useState(false);

  const { data: degrees = [], isLoading: degreesLoading } = useDegrees();
  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      degreeSlug: "",
      startYear: "",
      agree: false,
    },
    mode: "onSubmit",
  });

  const degreeSlugValue = form.watch("degreeSlug");
  const selectedDegree = React.useMemo(
    () => degrees.find((degree) => degree.slug === degreeSlugValue),
    [degrees, degreeSlugValue],
  );
  const startYearOptions = React.useMemo(() => {
    if (!selectedDegree || !selectedDegree.durationYears) return [];
    const duration = Math.max(0, selectedDegree.durationYears);
    if (duration <= 0) return [];
    const currentYear = new Date().getFullYear();
    const earliest = Math.max(1900, currentYear - duration + 1);
    const years: string[] = [];
    for (let year = currentYear; year >= earliest; year -= 1) {
      years.push(year.toString());
    }
    return years;
  }, [selectedDegree]);

  React.useEffect(() => {
    form.setValue("startYear", "");
    setStartYearOpen(false);
  }, [selectedDegree?.slug, form]);

  const pwValue = form.watch("password");
  const { score, label } = getStrength(pwValue ?? "");

  async function onSubmit(values: z.infer<typeof SignupSchema>) {
    console.log('values : ' , values);
    if (submitting) return; // guard double-click
    setSubmitting(true);
    try {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        degreeSlug : values.degreeSlug,
        startYear : Number(values.startYear),
        // callbackURL: window.location.origin, // optional
      });

      if (result.error) throw new Error(result.error.message);

      toast.success("Successfully signed up!");
      router.push("/login");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong during signup.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }
  // OAuth handlers (wire to your auth provider)
  const onGoogle = async () => {
    window.location.href = "/api/auth/oauth/google"; // adjust for your setup
  };
  const onGithub = async () => {
    window.location.href = "/api/auth/oauth/github"; // adjust for your setup
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-background to-muted px-4 py-10">
      <Card className="w-full max-w-[480px] shadow-lg border-border/60">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Join us and get started in minutes.</CardDescription>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Your full name"
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
                name="degreeSlug"
                render={({ field }) => {
                  const activeDegree = degrees.find(
                    (degree) => degree.slug === field.value,
                  );

                  return (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <Popover open={degreeOpen} onOpenChange={setDegreeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={degreeOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {activeDegree
                              ? activeDegree.name
                              : degreesLoading
                                ? "Loading degrees..."
                                : "Select a degree"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start">
                          {degreesLoading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Loading degrees...
                            </div>
                          ) : (
                            <Command>
                              <CommandInput placeholder="Search degrees..." />
                              <CommandEmpty>No degrees found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {degrees.map((degree) => (
                                    <CommandItem
                                      key={degree.slug}
                                      value={degree.slug}
                                      onSelect={(value) => {
                                        field.onChange(value);
                                        setDegreeOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === degree.slug
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span>{degree.name}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          )}
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Choose your degree so we can tailor your Campus Hub
                        experience.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="startYear"
                render={({ field }) => {
                  const hasOptions = startYearOptions.length > 0;
                  const buttonLabel = (() => {
                    if (!selectedDegree) return "Select a degree first";
                    if (!hasOptions) return "No valid start years";
                    return field.value || "Select start year";
                  })();

                  return (
                    <FormItem>
                      <FormLabel>Start Year</FormLabel>
                      <Popover open={startYearOpen} onOpenChange={setStartYearOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={startYearOpen}
                            disabled={!selectedDegree || !hasOptions}
                            className={cn(
                              "w-full justify-between",
                              (!field.value || !selectedDegree) && "text-muted-foreground",
                            )}
                          >
                            {buttonLabel}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0" align="start">
                          {!selectedDegree ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Select a degree first.
                            </div>
                          ) : !hasOptions ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No start years available.
                            </div>
                          ) : (
                            <Command>
                              <CommandInput placeholder="Search year..." />
                              <CommandEmpty>No year found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {startYearOptions.map((year) => (
                                    <CommandItem
                                      key={year}
                                      value={year}
                                      onSelect={(value) => {
                                        field.onChange(value);
                                        setStartYearOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === year ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <span>{year}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          )}
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Pick the academic year you started your degree.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                    <FormDescription>
                      Use 8+ chars including uppercase, lowercase, number &
                      symbol.
                    </FormDescription>
                    <PasswordMeter score={score} label={label} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type={showPw2 ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw2((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPw2 ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agree"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start gap-1">
                    <FormMessage className="" />

                    <FormControl>
                      <Checkbox
                        id="agree"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="agree" className="font-normal">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="underline underline-offset-4"
                        >
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          className="underline underline-offset-4"
                        >
                          Privacy Policy
                        </Link>
                      </FormLabel>

                      <FormDescription className="flex items-center gap-1 text-xs">
                        <ShieldCheck className="size-4" /> Your data is
                        encrypted at rest & in transit.
                      </FormDescription>
                    </div>
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
                Create account
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function PasswordMeter({ score, label }: { score: number; label: string }) {
  const normalized = Math.max(0, Math.min(score, 5));
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={`strength-${index}`}
            className={`h-1 flex-1 rounded-full ${
              index < normalized ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
