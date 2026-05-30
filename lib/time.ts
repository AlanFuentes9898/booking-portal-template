import { formatInTimeZone } from "date-fns-tz";
import { es, enUS } from "date-fns/locale";
import { publicEnv } from "@/lib/env";

/**
 * Active IANA timezone for this deploy.
 * Set via `NEXT_PUBLIC_TIMEZONE` env var. Defaults to America/Mexico_City.
 * Re-exported from a single place so a future settings-override is easy.
 */
export const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

/**
 * Format a UTC instant in CLINIC_TZ with locale-aware month/day names.
 *
 * Uses `formatInTimeZone` rather than `format({ timeZone })` because the
 * latter loses its `timeZone` option after the Next.js / Turbopack bundle
 * tree-shakes `date-fns-tz` v3 (observed in production: stored 17:00 UTC
 * was rendered as "17:00" instead of "11:00" America/Mexico_City).
 * `formatInTimeZone` is the explicit unambiguous API and is what we already
 * use successfully in the calendar view.
 */
export function formatTz(
  iso: string | Date,
  pattern: string,
  locale: "es" | "en" = "es",
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return formatInTimeZone(d, CLINIC_TZ, pattern, {
    locale: locale === "es" ? es : enUS,
  });
}
