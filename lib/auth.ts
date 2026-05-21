import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "owner" | "assistant";
  avatar_url: string | null;
};

/** Return the current Supabase auth user or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's profile. Returns null when not signed in or no
 * profile row exists yet (e.g. trigger hasn't run for older auth users).
 */
export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;
  // Use admin client to bypass RLS — staff_all_profiles requires authenticated
  // role but in SSR contexts the cookie-based auth.role() may be 'anon' until
  // the request completes. Service role is server-only so this is safe.
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,role,avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

/**
 * Server-side guard. Redirects to login when there is no session.
 * Returns the profile when authenticated.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}

/**
 * Guard a route to specific roles. Owner has access to everything.
 * Use in Server Components/Actions.
 */
export async function requireRole(
  allowed: Array<Profile["role"]>,
): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect("/admin");
  }
  return profile;
}
