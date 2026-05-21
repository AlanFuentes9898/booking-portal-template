"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name_es: z.string().min(1).max(120),
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

export async function upsertAppointmentType(formData: FormData) {
  await requireProfile();
  const priceRaw = formData.get("price_mxn");
  const parsed = upsertSchema.parse({
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

  const supabase = createAdminClient();
  if (parsed.id) {
    await supabase
      .from("appointment_types")
      .update({
        name_es: parsed.name_es,
        name_en: parsed.name_en,
        description_es: parsed.description_es,
        description_en: parsed.description_en,
        duration_minutes: parsed.duration_minutes,
        price_mxn: parsed.price_mxn,
        is_for_new_patients: parsed.is_for_new_patients,
        is_active: parsed.is_active,
        sort_order: parsed.sort_order,
      })
      .eq("id", parsed.id);
  } else {
    await supabase.from("appointment_types").insert({
      name_es: parsed.name_es,
      name_en: parsed.name_en,
      description_es: parsed.description_es,
      description_en: parsed.description_en,
      duration_minutes: parsed.duration_minutes,
      price_mxn: parsed.price_mxn,
      is_for_new_patients: parsed.is_for_new_patients,
      is_active: parsed.is_active,
      sort_order: parsed.sort_order,
    });
  }
  revalidatePath("/admin/configuracion/tipos-cita");
  revalidatePath("/", "layout");
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
