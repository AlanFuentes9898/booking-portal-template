import { z } from "zod";

/**
 * Validates env vars at boot. Fails fast if anything required is missing.
 * Splits public (client-safe) from server-only secrets.
 *
 * IMPORTANT: never import this file from client components if you only need
 * NEXT_PUBLIC_* values — import `publicEnv` from a separate barrel.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["es", "en"]).default("es"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  // ===== Deploy-time identity (white-label) =====
  /** IANA timezone for this clinic. Affects calendar, slots, reminders. */
  NEXT_PUBLIC_TIMEZONE: z.string().default("America/Mexico_City"),
  /** ISO 4217 currency code shown next to prices. */
  NEXT_PUBLIC_CURRENCY_CODE: z.string().default("MXN"),
  /** BCP-47 locale used for number/date formatting (e.g. price displays). */
  NEXT_PUBLIC_CURRENCY_LOCALE: z.string().default("es-MX"),
  /** Fallback brand name when settings.brand_name is empty. */
  NEXT_PUBLIC_BRAND_NAME: z.string().default("Mi Clínica"),
  NEXT_PUBLIC_BRAND_SHORT_NAME: z.string().default("Mi Clínica"),
  /** One of: nutrition, psychology, medical, dental, coach, generic. Informational. */
  NEXT_PUBLIC_VERTICAL: z.string().default("generic"),
  // ===== Feature flags =====
  /**
   * Show WhatsApp integration UI (toggle in General + column in Notifications).
   * Default off — turn on once you've registered your Meta WhatsApp Cloud API
   * templates and filled the WHATSAPP_* server-side env vars.
   */
  NEXT_PUBLIC_FEATURE_WHATSAPP: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
  ADMIN_WHATSAPP_NUMBER: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
  NEXT_PUBLIC_CURRENCY_CODE: process.env.NEXT_PUBLIC_CURRENCY_CODE,
  NEXT_PUBLIC_CURRENCY_LOCALE: process.env.NEXT_PUBLIC_CURRENCY_LOCALE,
  NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  NEXT_PUBLIC_BRAND_SHORT_NAME: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME,
  NEXT_PUBLIC_VERTICAL: process.env.NEXT_PUBLIC_VERTICAL,
  NEXT_PUBLIC_FEATURE_WHATSAPP: process.env.NEXT_PUBLIC_FEATURE_WHATSAPP,
});

if (!parsedPublic.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid public env vars:", parsedPublic.error.flatten());
  throw new Error("Invalid public env vars — check console output");
}

export const publicEnv = parsedPublic.data;

// Server env is lazy — only validated when imported from a server module.
// Avoids client bundle errors.
let _serverEnv: z.infer<typeof serverSchema> | undefined;
export function serverEnv(): z.infer<typeof serverSchema> {
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid server env vars:", parsed.error.flatten());
    throw new Error("Invalid server env vars — check console output");
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}
