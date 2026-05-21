"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export async function updatePatientNotes(formData: FormData) {
  await requireProfile();
  const id = z.string().uuid().parse(formData.get("id"));
  const notes = String(formData.get("admin_notes") ?? "").slice(0, 8000);
  const supabase = createAdminClient();
  await supabase
    .from("patients")
    .update({
      admin_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath(`/admin/pacientes/${id}`);
}
