"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import {
  type SettingsActionState,
  zodIssuesToFieldErrors,
} from "@/lib/admin-form-state";

const profileSchema = z.object({
  brand_name: z.string().max(80),
  brand_short_name: z.string().max(60),
  brand_profession_es: z.string().max(80),
  brand_profession_en: z.string().max(80),
  brand_tagline_es: z.string().max(160),
  brand_tagline_en: z.string().max(160),
  hero_eyebrow_es: z.string().max(80),
  hero_eyebrow_en: z.string().max(80),
  hero_title_es: z.string().max(160),
  hero_title_en: z.string().max(160),
  hero_subtitle_es: z.string().max(320),
  hero_subtitle_en: z.string().max(320),
  term_patient_es: z.string().max(40),
  term_patient_en: z.string().max(40),
  term_patient_plural_es: z.string().max(40),
  term_patient_plural_en: z.string().max(40),
  bio_es: z.string().max(4000),
  bio_en: z.string().max(4000),
  public_phone: z.string().max(40),
  public_email: z.string().email("Email no válido").or(z.literal("")),
  public_address: z.string().max(400),
  office_city: z.string().max(40),
  social_instagram_url: z
    .string()
    .url("URL no válida (ej: https://instagram.com/...)")
    .or(z.literal("")),
  social_facebook_url: z
    .string()
    .url("URL no válida (ej: https://facebook.com/...)")
    .or(z.literal("")),
  social_instagram_handle: z.string().max(60),
});

export async function savePublicProfile(
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

  const get = (k: string) => String(formData.get(k) ?? "");
  const parsed = profileSchema.safeParse({
    brand_name: get("brand_name"),
    brand_short_name: get("brand_short_name"),
    brand_profession_es: get("brand_profession_es"),
    brand_profession_en: get("brand_profession_en"),
    brand_tagline_es: get("brand_tagline_es"),
    brand_tagline_en: get("brand_tagline_en"),
    hero_eyebrow_es: get("hero_eyebrow_es"),
    hero_eyebrow_en: get("hero_eyebrow_en"),
    hero_title_es: get("hero_title_es"),
    hero_title_en: get("hero_title_en"),
    hero_subtitle_es: get("hero_subtitle_es"),
    hero_subtitle_en: get("hero_subtitle_en"),
    term_patient_es: get("term_patient_es") || "Paciente",
    term_patient_en: get("term_patient_en") || "Patient",
    term_patient_plural_es: get("term_patient_plural_es") || "Pacientes",
    term_patient_plural_en: get("term_patient_plural_en") || "Patients",
    bio_es: get("bio_es"),
    bio_en: get("bio_en"),
    public_phone: get("public_phone"),
    public_email: get("public_email"),
    public_address: get("public_address"),
    office_city: get("office_city") || "CDMX",
    social_instagram_url: get("social_instagram_url"),
    social_facebook_url: get("social_facebook_url"),
    social_instagram_handle: get("social_instagram_handle"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Algunos campos exceden el límite o tienen valores inválidos.",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      ts: Date.now(),
    };
  }

  try {
    const supabase = createAdminClient();
    const rows = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value: JSON.parse(JSON.stringify(value)),
      updated_at: new Date().toISOString(),
    }));
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
          : "No se pudo guardar el perfil. Intenta de nuevo.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/perfil");
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil público guardado", ts: Date.now() };
}
