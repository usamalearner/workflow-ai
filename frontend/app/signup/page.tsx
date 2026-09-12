"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { signUp, continueAsGuest, isDemo } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp(name, email, password);
      if (needsEmailConfirmation) {
        toast.success("Check your email to confirm your account before signing in.");
        router.push("/login");
      } else {
        toast.success("Workspace created");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  function explore() {
    setGuestLoading(true);
    continueAsGuest();
    router.push("/dashboard");
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start turning workplace information into action."
    >
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        loading={guestLoading}
        onClick={explore}
      >
        <Compass className="h-4 w-4" /> Explore the demo workspace
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        No account needed — instantly loads a sample workspace you can test
        everything in.
      </p>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or create an account</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled
          title="Google sign-in is coming soon"
        >
          Continue with Google
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Coming soon
          </span>
        </Button>
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Syed Usama"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Create workspace
        </Button>
        {isDemo && (
          <p className="rounded-lg bg-secondary/60 p-2.5 text-center text-xs text-muted-foreground">
            Demo mode — no email verification, your workspace is local to this
            browser.
          </p>
        )}
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
