"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(120),
  role: z.enum(["owner", "assistant"]),
});

export type InviteResult = { ok: boolean; error: string | null };

export async function inviteUser(
  _prev: InviteResult,
  formData: FormData,
): Promise<InviteResult> {
  await requireRole(["owner"]);
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = createAdminClient();
  // 1. Create the auth user (auto-confirmed). Trigger inserts profile row.
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });
  if (error || !created.user) {
    return { ok: false, error: error?.message ?? "create_failed" };
  }

  // 2. Trigger will have inserted the profile with default role.
  // Override the role + full_name (in case trigger fell back to email-prefix).
  await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role,
    })
    .eq("id", created.user.id);

  // 3. Generate a password setup link the owner can forward.
  // We use the `recovery` link so the invitee sets their own password.
  await supabase.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
  });

  revalidatePath("/admin/configuracion/usuarios");
  return { ok: true, error: null };
}

const idSchema = z.string().uuid();

export async function updateUserRole(formData: FormData) {
  const me = await requireRole(["owner"]);
  const id = idSchema.parse(formData.get("id"));
  const role = z.enum(["owner", "assistant"]).parse(formData.get("role"));
  if (id === me.id && role === "assistant") {
    // Prevent demoting yourself if you're the only owner
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");
    if ((count ?? 0) <= 1) return;
  }
  const supabase = createAdminClient();
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/configuracion/usuarios");
}

export async function deleteUser(formData: FormData) {
  const me = await requireRole(["owner"]);
  const id = idSchema.parse(formData.get("id"));
  if (id === me.id) return; // never let an owner delete themselves
  const supabase = createAdminClient();
  await supabase.auth.admin.deleteUser(id);
  // Profile row deletes via ON DELETE CASCADE from auth.users
  revalidatePath("/admin/configuracion/usuarios");
}

export async function sendPasswordReset(formData: FormData) {
  await requireRole(["owner"]);
  const email = z.string().email().parse(formData.get("email"));
  const supabase = createAdminClient();
  await supabase.auth.admin.generateLink({ type: "recovery", email });
  revalidatePath("/admin/configuracion/usuarios");
}
