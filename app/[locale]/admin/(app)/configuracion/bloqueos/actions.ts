"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { CLINIC_TZ } from "@/lib/time";

const blockSchema = z.object({
  start_local: z.string(), // "YYYY-MM-DDTHH:mm"
  end_local: z.string(),
  reason: z.string().max(200).optional(),
});

export async function createBlock(formData: FormData) {
  const profile = await requireProfile();
  const parsed = blockSchema.parse({
    start_local: String(formData.get("start_local") ?? ""),
    end_local: String(formData.get("end_local") ?? ""),
    reason: String(formData.get("reason") ?? "") || undefined,
  });
  const startUtc = fromZonedTime(parsed.start_local, CLINIC_TZ);
  const endUtc = fromZonedTime(parsed.end_local, CLINIC_TZ);
  if (endUtc <= startUtc) return;

  const supabase = createAdminClient();
  await supabase.from("blocked_periods").insert({
    start_time: startUtc.toISOString(),
    end_time: endUtc.toISOString(),
    reason: parsed.reason ?? null,
    created_by: profile.id,
  });
  revalidatePath("/admin/configuracion/bloqueos");
  revalidatePath("/agendar");
}

export async function deleteBlock(formData: FormData) {
  await requireProfile();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = createAdminClient();
  await supabase.from("blocked_periods").delete().eq("id", id);
  revalidatePath("/admin/configuracion/bloqueos");
  revalidatePath("/agendar");
}
