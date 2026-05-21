import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/** Supabase client for Server Components and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from Server Component — safe to ignore if middleware refreshes session.
          }
        },
      },
    },
  );
}
