import { createClient } from "@/utils/supabase/client";

export { createClient };

export async function getAccessToken(): Promise<string | null> {
  const client = createClient();
  if (!client) return null;
  const {
    data: { session },
  } = await client.auth.getSession();
  return session?.access_token ?? null;
}
