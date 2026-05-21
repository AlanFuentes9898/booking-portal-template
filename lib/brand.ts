import "server-only";
import { publicEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";

/**
 * Resolved brand identity for the current deploy.
 *
 * Source-of-truth order:
 *   1. `settings` row in DB (admin editable at runtime)
 *   2. `NEXT_PUBLIC_BRAND_*` env vars (deploy-time defaults)
 *   3. Hardcoded "Mi Clínica" if everything is empty
 */
export type Brand = {
  /** Full brand name (e.g. "Dr. Juan Pérez Cardiología"). */
  name: string;
  /** Short brand name used in compact spots (header, sidebar). */
  shortName: string;
  /** Profession in Spanish (e.g. "Nutrióloga Deportiva"). May be empty. */
  professionEs: string;
  /** Profession in English. May be empty. */
  professionEn: string;
  /** Patient/Cliente terminology in each locale. */
  patient: { es: string; en: string; pluralEs: string; pluralEn: string };
  /** Currency display info. */
  currency: { code: string; locale: string };
  /** IANA timezone. */
  timezone: string;
  /** Vertical key (informational). */
  vertical: string;
};

export type LocalizedBrand = {
  name: string;
  shortName: string;
  profession: string;
  patient: string;
  patientPlural: string;
};

/** Pick localized strings out of a Brand for a specific locale. */
export function localizeBrand(brand: Brand, locale: "es" | "en"): LocalizedBrand {
  const profession =
    locale === "en"
      ? brand.professionEn || brand.professionEs
      : brand.professionEs;
  return {
    name: brand.name,
    shortName: brand.shortName,
    profession,
    patient: locale === "en" ? brand.patient.en : brand.patient.es,
    patientPlural:
      locale === "en" ? brand.patient.pluralEn : brand.patient.pluralEs,
  };
}

function pick<T extends string>(...candidates: (T | null | undefined)[]): T {
  for (const c of candidates) {
    if (c && String(c).trim() !== "") return c;
  }
  return "" as T;
}

/**
 * Build the brand object from DB settings + env defaults.
 * Call once per request (server-side). Cheap — getSettings already does this.
 */
export async function getBrand(): Promise<Brand> {
  const s = await getSettings();
  const name = pick(s.brand_name, publicEnv.NEXT_PUBLIC_BRAND_NAME, "Mi Clínica");
  const shortName = pick(
    s.brand_short_name,
    publicEnv.NEXT_PUBLIC_BRAND_SHORT_NAME,
    name,
  );
  return {
    name,
    shortName,
    professionEs: s.brand_profession_es ?? "",
    professionEn: s.brand_profession_en ?? "",
    patient: {
      es: s.term_patient_es || "Paciente",
      en: s.term_patient_en || "Patient",
      pluralEs: s.term_patient_plural_es || "Pacientes",
      pluralEn: s.term_patient_plural_en || "Patients",
    },
    currency: {
      code: publicEnv.NEXT_PUBLIC_CURRENCY_CODE,
      locale: publicEnv.NEXT_PUBLIC_CURRENCY_LOCALE,
    },
    timezone: s.timezone || publicEnv.NEXT_PUBLIC_TIMEZONE,
    vertical: publicEnv.NEXT_PUBLIC_VERTICAL,
  };
}

/** Synchronous brand-from-env, for places where we can't await (e.g. some early
 * SSR contexts). Returns env-only data; misses runtime overrides. */
export function getEnvBrand(): Pick<
  Brand,
  "name" | "shortName" | "currency" | "timezone" | "vertical"
> {
  return {
    name: publicEnv.NEXT_PUBLIC_BRAND_NAME,
    shortName: publicEnv.NEXT_PUBLIC_BRAND_SHORT_NAME,
    currency: {
      code: publicEnv.NEXT_PUBLIC_CURRENCY_CODE,
      locale: publicEnv.NEXT_PUBLIC_CURRENCY_LOCALE,
    },
    timezone: publicEnv.NEXT_PUBLIC_TIMEZONE,
    vertical: publicEnv.NEXT_PUBLIC_VERTICAL,
  };
}

/** Format a price for display. Works server- or client-side; pulls from env. */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "";
  const { NEXT_PUBLIC_CURRENCY_CODE: code, NEXT_PUBLIC_CURRENCY_LOCALE: locale } =
    publicEnv;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()} ${code}`;
  }
}
