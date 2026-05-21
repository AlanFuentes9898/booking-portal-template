"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

const emailSchema = z.object({
  notify_email_on_booking: z.boolean(),
  notify_email_on_cancellation: z.boolean(),
  notify_email_reminder_24h: z.boolean(),
  daily_summary_hour: z.number().int().min(0).max(23),
});

const whatsappSchema = z.object({
  notify_whatsapp_on_booking: z.boolean(),
  notify_whatsapp_on_cancellation: z.boolean(),
  notify_whatsapp_reminder_24h: z.boolean(),
});

export async function saveNotificationSettings(formData: FormData) {
  await requireProfile();
  const emailParsed = emailSchema.parse({
    notify_email_on_booking: formData.get("notify_email_on_booking") === "on",
    notify_email_on_cancellation:
      formData.get("notify_email_on_cancellation") === "on",
    notify_email_reminder_24h:
      formData.get("notify_email_reminder_24h") === "on",
    daily_summary_hour: Number(formData.get("daily_summary_hour") ?? 8),
  });

  const ts = new Date().toISOString();
  const rows: Array<{ key: string; value: unknown; updated_at: string }> = [];
  for (const [key, value] of Object.entries(emailParsed)) {
    rows.push({ key, value: JSON.parse(JSON.stringify(value)), updated_at: ts });
  }

  // Only persist whatsapp toggles when the feature flag is on (otherwise the
  // checkboxes aren't rendered and we'd nuke any saved-true value).
  if (publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP) {
    const waParsed = whatsappSchema.parse({
      notify_whatsapp_on_booking:
        formData.get("notify_whatsapp_on_booking") === "on",
      notify_whatsapp_on_cancellation:
        formData.get("notify_whatsapp_on_cancellation") === "on",
      notify_whatsapp_reminder_24h:
        formData.get("notify_whatsapp_reminder_24h") === "on",
    });
    for (const [key, value] of Object.entries(waParsed)) {
      rows.push({
        key,
        value: JSON.parse(JSON.stringify(value)),
        updated_at: ts,
      });
    }
  }

  const supabase = createAdminClient();
  await supabase.from("settings").upsert(rows, { onConflict: "key" });
  revalidatePath("/admin/configuracion/notificaciones");
}
