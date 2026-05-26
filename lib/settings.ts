import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Typed accessor for the `settings` key-value table.
 * Keys mirror the seed inserts in 0001_init.sql.
 */
export type AppSettings = {
  buffer_minutes: number;
  min_booking_hours_ahead: number;
  max_booking_days_ahead: number;
  show_prices_publicly: boolean;
  default_language: "es" | "en";
  timezone: string;
  public_phone: string;
  public_email: string;
  public_address: string;
  /** City label shown in the public booking flow and next to times in emails/admin (e.g. "Morelia"). */
  office_city: string;
  /**
   * Email that receives admin notifications (new bookings, cancellations, daily
   * summary). When empty, falls back to the ADMIN_NOTIFICATION_EMAIL env var.
   */
  admin_notification_email: string;
  bio_es: string;
  bio_en: string;
  cancellation_policy_es: string;
  cancellation_policy_en: string;
  cancellation_hours_limit: number;
  payments_enabled: boolean;
  whatsapp_enabled: boolean;
  daily_summary_hour: number;
  // ===== Identity (overrides env defaults at runtime) =====
  brand_name: string;
  brand_short_name: string;
  brand_profession_es: string; // e.g. "Nutrióloga Deportiva", "Psicólogo Clínico"
  brand_profession_en: string;
  // ===== Public profile / brand =====
  brand_tagline_es: string;
  brand_tagline_en: string;
  // ===== Landing hero copy (editable per practice) =====
  hero_eyebrow_es: string;
  hero_eyebrow_en: string;
  hero_title_es: string;
  hero_title_en: string;
  hero_subtitle_es: string;
  hero_subtitle_en: string;
  // ===== Terminology (Paciente / Cliente / Consultante / etc) =====
  term_patient_es: string;
  term_patient_en: string;
  term_patient_plural_es: string;
  term_patient_plural_en: string;
  // ===== Social =====
  social_instagram_url: string;
  social_facebook_url: string;
  social_instagram_handle: string;
  // ===== Notification toggles =====
  notify_email_on_booking: boolean;
  notify_email_on_cancellation: boolean;
  notify_email_reminder_24h: boolean;
  notify_whatsapp_on_booking: boolean;
  notify_whatsapp_on_cancellation: boolean;
  notify_whatsapp_reminder_24h: boolean;
};

const DEFAULTS: AppSettings = {
  buffer_minutes: 10,
  min_booking_hours_ahead: 4,
  max_booking_days_ahead: 60,
  show_prices_publicly: true,
  default_language: "es",
  timezone: "America/Mexico_City",
  public_phone: "",
  public_email: "",
  public_address: "",
  office_city: "CDMX",
  admin_notification_email: "",
  bio_es: "",
  bio_en: "",
  cancellation_policy_es:
    "Puedes cancelar o reagendar tu cita hasta 12 horas antes sin costo.",
  cancellation_policy_en:
    "You can cancel or reschedule up to 12 hours before your appointment at no cost.",
  cancellation_hours_limit: 12,
  payments_enabled: false,
  whatsapp_enabled: true,
  daily_summary_hour: 8,
  // Identity defaults are intentionally empty so the brand layer can fall
  // back to the env-var defaults (NEXT_PUBLIC_BRAND_NAME etc).
  brand_name: "",
  brand_short_name: "",
  brand_profession_es: "",
  brand_profession_en: "",
  brand_tagline_es: "",
  brand_tagline_en: "",
  hero_eyebrow_es: "",
  hero_eyebrow_en: "",
  hero_title_es: "",
  hero_title_en: "",
  hero_subtitle_es: "",
  hero_subtitle_en: "",
  term_patient_es: "Paciente",
  term_patient_en: "Patient",
  term_patient_plural_es: "Pacientes",
  term_patient_plural_en: "Patients",
  social_instagram_url: "",
  social_facebook_url: "",
  social_instagram_handle: "",
  notify_email_on_booking: true,
  notify_email_on_cancellation: true,
  notify_email_reminder_24h: true,
  notify_whatsapp_on_booking: false,
  notify_whatsapp_on_cancellation: false,
  notify_whatsapp_reminder_24h: false,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("settings").select("key,value");
    if (error || !data) return DEFAULTS;
    const settings: Record<string, unknown> = { ...DEFAULTS };
    for (const row of data) {
      settings[row.key as string] = row.value;
    }
    return settings as AppSettings;
  } catch {
    return DEFAULTS;
  }
}

export type AppointmentType = {
  id: string;
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
  duration_minutes: number;
  price_mxn: number | null;
  color_hex: string | null;
  is_for_new_patients: boolean;
  is_active: boolean;
  sort_order: number;
};

export async function getActiveAppointmentTypes(): Promise<AppointmentType[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointment_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as AppointmentType[];
  } catch {
    return [];
  }
}
