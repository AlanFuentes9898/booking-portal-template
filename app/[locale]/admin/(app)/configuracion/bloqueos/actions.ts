"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { CLINIC_TZ } from "@/lib/time";
import {
  type SettingsActionState,
  zodIssuesToFieldErrors,
} from "@/lib/admin-form-state";

const blockSchema = z.object({
  start_local: z.string().min(1, "Selecciona la fecha y hora de inicio"),
  end_local: z.string().min(1, "Selecciona la fecha y hora de fin"),
  reason: z.string().max(200).optional(),
});

export async function createBlock(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return {
      ok: false,
      message: "Tu sesión expiró. Vuelve a iniciar sesión.",
      ts: Date.now(),
    };
  }

  const parsed = blockSchema.safeParse({
    start_local: String(formData.get("start_local") ?? ""),
    end_local: String(formData.get("end_local") ?? ""),
    reason: String(formData.get("reason") ?? "") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      ts: Date.now(),
    };
  }

  const startUtc = fromZonedTime(parsed.data.start_local, CLINIC_TZ);
  const endUtc = fromZonedTime(parsed.data.end_local, CLINIC_TZ);
  if (endUtc <= startUtc) {
    return {
      ok: false,
      message: "La fecha de fin debe ser posterior a la de inicio.",
      fieldErrors: { end_local: "Debe ser posterior al inicio" },
      ts: Date.now(),
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("blocked_periods").insert({
      start_time: startUtc.toISOString(),
      end_time: endUtc.toISOString(),
      reason: parsed.data.reason ?? null,
      created_by: profile.id,
    });
    if (error) throw error;
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `No se pudo crear: ${err.message}`
          : "No se pudo crear el bloqueo.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/bloqueos");
  revalidatePath("/agendar");
  return { ok: true, message: "Bloqueo creado", ts: Date.now() };
}

export async function deleteBlock(formData: FormData) {
  await requireProfile();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = createAdminClient();
  await supabase.from("blocked_periods").delete().eq("id", id);
  revalidatePath("/admin/configuracion/bloqueos");
  revalidatePath("/agendar");
}
