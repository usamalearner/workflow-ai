"use client";

import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/**
 * Enters a local guest session (no Supabase account needed) and jumps straight
 * to the dashboard — the "Explore Demo" path from the landing page.
 */
export function ExploreDemoButton(props: ButtonProps) {
  const { continueAsGuest } = useAuth();
  const router = useRouter();

  return (
    <Button
      {...props}
      onClick={() => {
        continueAsGuest();
        router.push("/dashboard");
      }}
    >
      {props.children}
    </Button>
  );
}
