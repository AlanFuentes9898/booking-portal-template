"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

const idSchema = z.string().uuid();
const statusSchema = z.enum([
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export async function updateAppointmentStatus(formData: FormData) {
  await requireProfile();
  const id = idSchema.parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  const supabase = createAdminClient();
  await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/admin/citas/${id}`);
  revalidatePath("/admin/citas");
  revalidatePath("/admin");
}

export async function updateAdminNotes(formData: FormData) {
  await requireProfile();
  const id = idSchema.parse(formData.get("id"));
  const notes = String(formData.get("admin_notes") ?? "").slice(0, 4000);
  const supabase = createAdminClient();
  await supabase
    .from("appointments")
    .update({
      admin_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath(`/admin/citas/${id}`);
}
