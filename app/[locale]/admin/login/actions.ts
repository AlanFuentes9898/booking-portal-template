"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export type LoginState = { error: string | null };

export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "invalid_credentials_format" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { error: error.message };
  }

  const dest = parsed.data.next && parsed.data.next.startsWith("/admin")
    ? parsed.data.next
    : "/admin";
  redirect(dest);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
