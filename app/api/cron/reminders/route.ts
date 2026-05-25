import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { AppointmentReminderEmail } from "@/emails/appointment-reminder";
import { formatTz } from "@/lib/time";
import { publicEnv } from "@/lib/env";
import { assertCronAuth } from "@/lib/cron-auth";
import { getSettings } from "@/lib/settings";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REMINDER_TEMPLATE_KEY = "reminder_24h_patient";

type Appt = {
  id: string;
  start_time: string;
  end_time: string;
  modality: "in_person" | "virtual";
  meet_link: string | null;
  cancellation_token: string;
  patients: { full_name: string; email: string } | null;
  appointment_types: { name_es: string; name_en: string | null } | null;
};

/**
 * Daily cron. Finds confirmed appointments starting between [now+23h, now+25h),
 * sends each one a 24h reminder, and logs to notification_log to dedupe.
 *
 * Schedule: 8 AM CDMX (= 14:00 UTC) — matches `vercel.json`. Runs once a day
 * because Vercel Hobby plan caps at 1 cron run/day. For per-hour granularity,
 * upgrade to Vercel Pro and change the schedule back to `0 * * * *`.
 */
export async function GET(req: NextRequest) {
  const auth = assertCronAuth(req);
  if (auth) return auth;

  const [settings, brand] = await Promise.all([getSettings(), getBrand()]);
  if (!settings.notify_email_reminder_24h) {
    return NextResponse.json({ ok: true, skipped_all: true, reason: "email_reminders_disabled" });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const from = new Date(now.getTime() + 23 * 3600_000);
  const to = new Date(now.getTime() + 25 * 3600_000);

  const { data: appts, error } = await supabase
    .from("appointments")
    .select(
      "id,start_time,end_time,modality,meet_link,cancellation_token, patients ( full_name, email ), appointment_types ( name_es, name_en )",
    )
    .eq("status", "confirmed")
    .gte("start_time", from.toISOString())
    .lt("start_time", to.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (appts ?? []) as unknown as Appt[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  // Dedupe: pull all notification_log rows for these appointments + template
  const ids = rows.map((r) => r.id);
  const { data: logs } = await supabase
    .from("notification_log")
    .select("appointment_id,status")
    .in("appointment_id", ids)
    .eq("template_key", REMINDER_TEMPLATE_KEY)
    .eq("status", "sent");

  const alreadySent = new Set(
    (logs ?? []).map((l) => l.appointment_id as string),
  );

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const a of rows) {
    if (alreadySent.has(a.id)) {
      skipped++;
      continue;
    }
    const patient = Array.isArray(a.patients) ? a.patients[0] : a.patients;
    const type = Array.isArray(a.appointment_types)
      ? a.appointment_types[0]
      : a.appointment_types;
    if (!patient || !type) {
      skipped++;
      continue;
    }
    // Locale heuristic: default to ES (we don't store locale per appointment).
    // Could be improved by adding `locale` column to appointments.
    const locale = "es" as const;
    const typeName = type.name_es;
    const formattedDate = formatTz(
      a.start_time,
      "EEEE d 'de' MMMM yyyy",
      locale,
    );
    const formattedTime = formatTz(a.start_time, "HH:mm");
    const manageUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/cita/${a.cancellation_token}`;

    const result = await sendEmail({
      to: patient.email,
      subject: `Recordatorio: tu cita es mañana — ${formattedDate}`,
      recipientType: "patient",
      appointmentId: a.id,
      templateKey: REMINDER_TEMPLATE_KEY,
      react: AppointmentReminderEmail({
        locale,
        patientName: patient.full_name,
        appointmentTypeName: typeName,
        formattedDate,
        formattedTime,
        modality: a.modality,
        meetLink: a.meet_link,
        manageUrl,
        brandName: brand.name,
        officeCity: settings.office_city,
      }),
    });

    if (result.ok) {
      sent++;
    } else {
      skipped++;
      if (result.error) errors.push(`${a.id}: ${result.error}`);
    }
  }

  return NextResponse.json({
    ok: true,
    window: { from: from.toISOString(), to: to.toISOString() },
    found: rows.length,
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
