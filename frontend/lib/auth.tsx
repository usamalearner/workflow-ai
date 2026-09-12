"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IS_DEMO } from "./constants";
import { createClient } from "./supabase";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to `{ needsEmailConfirmation: true }` when the project requires
   * confirming the address before a session exists — no session is created
   * yet, so the caller should NOT navigate to the dashboard in that case. */
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  /** Enters a local guest session without touching Supabase at all — the way
   * to explore the full product (including a real Supabase project) without
   * creating or confirming an account. Works even when Supabase is configured. */
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_KEY = "wf_demo_user";
const GUEST_COOKIE = "wf_guest";

function readDemoUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/** Readable (non-httpOnly) cookie so the edge middleware can recognise a
 * guest session and let it through to /dashboard even when Supabase is
 * configured and there's no real Supabase session. */
function setGuestCookie() {
  document.cookie = `${GUEST_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}
function clearGuestCookie() {
  document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A local guest session always wins — it never touches Supabase.
    const guest = readDemoUser();
    if (guest) {
      setUser(guest);
      setLoading(false);
      return;
    }
    if (IS_DEMO) {
      setLoading(false);
      return;
    }
    const client = createClient();
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
          full_name:
            (data.user.user_metadata?.full_name as string) ??
            (data.user.user_metadata?.name as string) ??
            "",
        });
      }
      setLoading(false);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? "",
              full_name:
                (session.user.user_metadata?.full_name as string) ?? "",
            }
          : null,
      );
    });
    return () => subscription.unsubscribe();
  }, []);

  const continueAsGuest = useCallback(() => {
    const u = { id: "guest", email: "guest@workflow.ai", full_name: "Guest Explorer" };
    localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    setGuestCookie();
    setUser(u);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_DEMO) {
      const u = { id: "demo", email, full_name: email.split("@")[0] };
      localStorage.setItem(DEMO_KEY, JSON.stringify(u));
      setGuestCookie();
      setUser(u);
      return;
    }
    const client = createClient()!;
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      if (IS_DEMO) {
        const u = { id: "demo", email, full_name: name };
        localStorage.setItem(DEMO_KEY, JSON.stringify(u));
        setGuestCookie();
        setUser(u);
        return { needsEmailConfirmation: false };
      }
      const client = createClient()!;
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw new Error(error.message);
      // Supabase returns a user but no session when email confirmation is
      // required — there's nothing to sign in to yet.
      return { needsEmailConfirmation: !data.session };
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    if (IS_DEMO) {
      const u = { id: "demo", email: "demo@workflow.ai", full_name: "Syed Usama" };
      localStorage.setItem(DEMO_KEY, JSON.stringify(u));
      setGuestCookie();
      setUser(u);
      return;
    }
    const client = createClient()!;
    await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_KEY);
    clearGuestCookie();
    if (!IS_DEMO) {
      await createClient()?.auth.signOut();
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemo: IS_DEMO,
      signIn,
      signUp,
      signInWithGoogle,
      continueAsGuest,
      signOut,
    }),
    [user, loading, signIn, signUp, signInWithGoogle, continueAsGuest, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
