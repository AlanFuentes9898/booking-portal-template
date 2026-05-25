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

const generalSchema = z.object({
  show_prices_publicly: z.boolean(),
  payments_enabled: z.boolean(),
  buffer_minutes: z.number().int().min(0).max(120),
  min_booking_hours_ahead: z.number().int().min(0).max(168),
  max_booking_days_ahead: z.number().int().min(1).max(365),
  cancellation_hours_limit: z.number().int().min(0).max(168),
  cancellation_policy_es: z.string().max(2000),
  cancellation_policy_en: z.string().max(2000),
});

export async function saveGeneralSettings(
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

  const parsed = generalSchema.safeParse({
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

  if (!parsed.success) {
    return {
      ok: false,
      message: "Algunos campos exceden el límite o tienen valores inválidos.",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      ts: Date.now(),
    };
  }

  const rows: Array<{ key: string; value: unknown; updated_at: string }> = [];
  const ts = new Date().toISOString();
  for (const [key, value] of Object.entries(parsed.data)) {
    rows.push({ key, value: JSON.parse(JSON.stringify(value)), updated_at: ts });
  }
  if (publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP) {
    rows.push({
      key: "whatsapp_enabled",
      value: formData.get("whatsapp_enabled") === "on",
      updated_at: ts,
    });
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
          : "No se pudo guardar la configuración. Intenta de nuevo.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/general");
  revalidatePath("/", "layout");
  return { ok: true, message: "Configuración guardada", ts: Date.now() };
}
