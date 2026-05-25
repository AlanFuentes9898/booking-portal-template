"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import {
  type SettingsActionState,
  zodIssuesToFieldErrors,
} from "@/lib/admin-form-state";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name_es: z.string().min(1, "Pon un nombre en español").max(120),
  name_en: z.string().max(120).optional().nullable(),
  description_es: z.string().max(500).optional().nullable(),
  description_en: z.string().max(500).optional().nullable(),
  duration_minutes: z.number().int().min(5).max(480),
  price_mxn: z.number().min(0).max(100000).nullable().optional(),
  is_for_new_patients: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(1000),
});

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length === 0 ? null : s;
}

export async function upsertAppointmentType(
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

  const priceRaw = formData.get("price_mxn");
  const parsed = upsertSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name_es: String(formData.get("name_es") ?? ""),
    name_en: emptyToNull(formData.get("name_en")),
    description_es: emptyToNull(formData.get("description_es")),
    description_en: emptyToNull(formData.get("description_en")),
    duration_minutes: Number(formData.get("duration_minutes") ?? 30),
    price_mxn:
      priceRaw === null || String(priceRaw).trim() === ""
        ? null
        : Number(priceRaw),
    is_for_new_patients: formData.get("is_for_new_patients") === "on",
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      ts: Date.now(),
    };
  }

  try {
    const supabase = createAdminClient();
    if (parsed.data.id) {
      const { error } = await supabase
        .from("appointment_types")
        .update({
          name_es: parsed.data.name_es,
          name_en: parsed.data.name_en,
          description_es: parsed.data.description_es,
          description_en: parsed.data.description_en,
          duration_minutes: parsed.data.duration_minutes,
          price_mxn: parsed.data.price_mxn,
          is_for_new_patients: parsed.data.is_for_new_patients,
          is_active: parsed.data.is_active,
          sort_order: parsed.data.sort_order,
        })
        .eq("id", parsed.data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("appointment_types").insert({
        name_es: parsed.data.name_es,
        name_en: parsed.data.name_en,
        description_es: parsed.data.description_es,
        description_en: parsed.data.description_en,
        duration_minutes: parsed.data.duration_minutes,
        price_mxn: parsed.data.price_mxn,
        is_for_new_patients: parsed.data.is_for_new_patients,
        is_active: parsed.data.is_active,
        sort_order: parsed.data.sort_order,
      });
      if (error) throw error;
    }
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `No se pudo guardar: ${err.message}`
          : "No se pudo guardar el tipo de cita.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/tipos-cita");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: parsed.data.id
      ? "Tipo de cita actualizado"
      : "Tipo de cita creado",
    ts: Date.now(),
  };
}

export async function toggleAppointmentTypeActive(formData: FormData) {
  await requireProfile();
  const id = z.string().uuid().parse(formData.get("id"));
  const next = formData.get("next") === "on";
  const supabase = createAdminClient();
  await supabase.from("appointment_types").update({ is_active: next }).eq("id", id);
  revalidatePath("/admin/configuracion/tipos-cita");
  revalidatePath("/", "layout");
}
