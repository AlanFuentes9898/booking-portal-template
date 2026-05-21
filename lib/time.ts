import { format as fnsFormat } from "date-fns-tz";
import { es, enUS } from "date-fns/locale";
import { publicEnv } from "@/lib/env";

/**
 * Active IANA timezone for this deploy.
 * Set via `NEXT_PUBLIC_TIMEZONE` env var. Defaults to America/Mexico_City.
 * Re-exported from a single place so a future settings-override is easy.
 */
export const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

/** Format a UTC instant in CLINIC_TZ with locale-aware month/day names. */
export function formatTz(
  iso: string | Date,
  pattern: string,
  locale: "es" | "en" = "es",
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return fnsFormat(d, pattern, {
    timeZone: CLINIC_TZ,
    locale: locale === "es" ? es : enUS,
  });
}
