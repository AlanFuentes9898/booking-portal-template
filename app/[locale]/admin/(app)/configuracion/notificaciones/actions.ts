"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import {
  type SettingsActionState,
  zodIssuesToFieldErrors,
} from "@/lib/admin-form-state";

const emailSchema = z.object({
  notify_email_on_booking: z.boolean(),
  notify_email_on_cancellation: z.boolean(),
  notify_email_reminder_24h: z.boolean(),
  daily_summary_hour: z.number().int().min(0).max(23),
  admin_notification_email: z
    .string()
    .email("Email no válido (ej: maricarmen@ejemplo.com)")
    .or(z.literal("")),
});

const whatsappSchema = z.object({
  notify_whatsapp_on_booking: z.boolean(),
  notify_whatsapp_on_cancellation: z.boolean(),
  notify_whatsapp_reminder_24h: z.boolean(),
});

export async function saveNotificationSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    await requireProfile();
  } catch {
    return {
      ok: false,
      message: "Tu sesión expiró. Vuelve a iniciar sesión.",
      ts: Date.now(),
    };
  }

  const emailParsed = emailSchema.safeParse({
    notify_email_on_booking: formData.get("notify_email_on_booking") === "on",
    notify_email_on_cancellation:
      formData.get("notify_email_on_cancellation") === "on",
    notify_email_reminder_24h:
      formData.get("notify_email_reminder_24h") === "on",
    daily_summary_hour: Number(formData.get("daily_summary_hour") ?? 8),
    admin_notification_email: String(
      formData.get("admin_notification_email") ?? "",
    ).trim(),
  });

  if (!emailParsed.success) {
    return {
      ok: false,
      message: "Algunos valores son inválidos.",
      fieldErrors: zodIssuesToFieldErrors(emailParsed.error.issues),
      ts: Date.now(),
    };
  }

  const ts = new Date().toISOString();
  const rows: Array<{ key: string; value: unknown; updated_at: string }> = [];
  for (const [key, value] of Object.entries(emailParsed.data)) {
    rows.push({ key, value: JSON.parse(JSON.stringify(value)), updated_at: ts });
  }

  if (publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP) {
    const waParsed = whatsappSchema.safeParse({
      notify_whatsapp_on_booking:
        formData.get("notify_whatsapp_on_booking") === "on",
      notify_whatsapp_on_cancellation:
        formData.get("notify_whatsapp_on_cancellation") === "on",
      notify_whatsapp_reminder_24h:
        formData.get("notify_whatsapp_reminder_24h") === "on",
    });
    if (!waParsed.success) {
      return {
        ok: false,
        message: "Valores de WhatsApp inválidos.",
        ts: Date.now(),
      };
    }
    for (const [key, value] of Object.entries(waParsed.data)) {
      rows.push({
        key,
        value: JSON.parse(JSON.stringify(value)),
        updated_at: ts,
      });
    }
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("settings")
      .upsert(rows, { onConflict: "key" });
    if (error) throw error;
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `No se pudo guardar: ${err.message}`
          : "No se pudo guardar la configuración de notificaciones.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/notificaciones");
  return { ok: true, message: "Notificaciones guardadas", ts: Date.now() };
}
