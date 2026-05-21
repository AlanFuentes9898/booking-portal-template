"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

const generalSchema = z.object({
  show_prices_publicly: z.boolean(),
  payments_enabled: z.boolean(),
  buffer_minutes: z.number().int().min(0).max(120),
  min_booking_hours_ahead: z.number().int().min(0).max(168),
  max_booking_days_ahead: z.number().int().min(1).max(365),
  cancellation_hours_limit: z.number().int().min(0).max(168),
  cancellation_policy_es: z.string().max(500),
  cancellation_policy_en: z.string().max(500),
});

export async function saveGeneralSettings(formData: FormData) {
  await requireProfile();
  const parsed = generalSchema.parse({
    show_prices_publicly: formData.get("show_prices_publicly") === "on",
    payments_enabled: formData.get("payments_enabled") === "on",
    buffer_minutes: Number(formData.get("buffer_minutes") ?? 10),
    min_booking_hours_ahead: Number(
      formData.get("min_booking_hours_ahead") ?? 4,
    ),
    max_booking_days_ahead: Number(
      formData.get("max_booking_days_ahead") ?? 60,
    ),
    cancellation_hours_limit: Number(
      formData.get("cancellation_hours_limit") ?? 12,
    ),
    cancellation_policy_es: String(
      formData.get("cancellation_policy_es") ?? "",
    ),
    cancellation_policy_en: String(
      formData.get("cancellation_policy_en") ?? "",
    ),
  });

  // whatsapp_enabled is only writable when the feature flag is on (i.e. the
  // checkbox is actually rendered). Otherwise we leave the existing setting
  // untouched so toggling the flag doesn't silently nuke it.
  const rows: Array<{ key: string; value: unknown; updated_at: string }> = [];
  const ts = new Date().toISOString();
  for (const [key, value] of Object.entries(parsed)) {
    rows.push({ key, value: JSON.parse(JSON.stringify(value)), updated_at: ts });
  }
  if (publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP) {
    rows.push({
      key: "whatsapp_enabled",
      value: formData.get("whatsapp_enabled") === "on",
      updated_at: ts,
    });
  }

  const supabase = createAdminClient();
  await supabase.from("settings").upsert(rows, { onConflict: "key" });
  revalidatePath("/admin/configuracion/general");
  revalidatePath("/", "layout"); // public pages read settings
}
