import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { DailySummaryAdminEmail, type DailySummaryItem } from "@/emails/daily-summary-admin";
import { getTodayAppointments } from "@/lib/admin-queries";
import { formatTz } from "@/lib/time";
import { serverEnv } from "@/lib/env";
import { assertCronAuth } from "@/lib/cron-auth";
import { getBrand } from "@/lib/brand";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEMPLATE_KEY = "daily_summary_admin";

/**
 * Run daily at the configured `daily_summary_hour` (MX time).
 * Schedule via vercel.json — Vercel cron is in UTC, so the hardcoded UTC time
 * in vercel.json should equal 8am MX (14:00 UTC, MX has no DST since 2022).
 * Sends a summary email to ADMIN_NOTIFICATION_EMAIL with all confirmed
 * appointments for today (clinic-local).
 */
export async function GET(req: NextRequest) {
  const auth = assertCronAuth(req);
  if (auth) return auth;

  const [appts, brand, settings] = await Promise.all([
    getTodayAppointments(),
    getBrand(),
    getSettings(),
  ]);
  const adminEmail =
    settings.admin_notification_email?.trim() ||
    serverEnv().ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    return NextResponse.json(
      { ok: false, error: "admin_notification_email not configured" },
      { status: 200 },
    );
  }
  const confirmed = appts.filter((a) => a.status === "confirmed");

  const formattedDate = formatTz(
    new Date(),
    "EEEE d 'de' MMMM yyyy",
    "es",
  );

  const items: DailySummaryItem[] = confirmed.map((a) => ({
    time: formatTz(a.start_time, "HH:mm"),
    patientName: a.patient?.full_name ?? "—",
    patientPhone: a.patient?.phone ?? "",
    typeName: a.appointment_type?.name_es ?? "Cita",
    modality: a.modality,
    isNew: a.patient?.is_new ?? false,
    meetLink: a.meet_link,
  }));

  const subject =
    items.length === 0
      ? `Resumen diario — Hoy sin citas (${formattedDate})`
      : `Resumen diario — ${items.length} ${items.length === 1 ? "cita" : "citas"} hoy (${formattedDate})`;

  const result = await sendEmail({
    to: adminEmail,
    subject,
    recipientType: "admin",
    templateKey: TEMPLATE_KEY,
    react: DailySummaryAdminEmail({
      formattedDate: capitalize(formattedDate),
      items,
      brandName: brand.name,
    }),
  });

  return NextResponse.json({
    ok: result.ok,
    sent_to: adminEmail,
    count: items.length,
    error: result.error,
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
