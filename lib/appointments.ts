import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAvailableSlots } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { formatTz } from "./time";
import { sendEmail } from "@/lib/email";
import { publicEnv, serverEnv } from "@/lib/env";
import { getBrand } from "@/lib/brand";
import { BookingConfirmationPatient } from "@/emails/booking-confirmation-patient";
import { BookingNotificationAdmin } from "@/emails/booking-notification-admin";
import { CancellationEmail } from "@/emails/cancellation";
import type { CreateAppointmentInput } from "@/lib/schemas/booking";

export type CreateAppointmentResult =
  | {
      ok: true;
      appointment_id: string;
      cancellation_token: string;
      end_time: string;
    }
  | { ok: false; error: string; status: number };

/**
 * End-to-end booking creation.
 * 1) Re-checks availability server-side (race-safe enough for solo nutritionist)
 * 2) Upserts patient by email
 * 3) Inserts appointment
 * 4) Fires confirmation emails (patient + admin) and logs
 */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const supabase = createAdminClient();
  const brand = await getBrand();
  const startTime = new Date(input.start_time);

  // 1. Load type + settings
  const [{ data: type, error: typeErr }, settings] = await Promise.all([
    supabase
      .from("appointment_types")
      .select("id,duration_minutes,name_es,name_en,is_active")
      .eq("id", input.appointment_type_id)
      .single(),
    getSettings(),
  ]);
  if (typeErr || !type || !type.is_active) {
    return { ok: false, error: "appointment_type_not_found", status: 404 };
  }

  const endTime = new Date(
    startTime.getTime() + type.duration_minutes * 60_000,
  );

  // 2. Re-check availability around the proposed slot
  const windowFrom = new Date(startTime.getTime() - 24 * 3600_000);
  const windowTo = new Date(endTime.getTime() + 24 * 3600_000);

  const [whRes, blockRes, apptRes] = await Promise.all([
    supabase
      .from("working_hours")
      .select("day_of_week,start_time,end_time,is_active")
      .eq("is_active", true),
    supabase
      .from("blocked_periods")
      .select("start_time,end_time")
      .lt("start_time", windowTo.toISOString())
      .gt("end_time", windowFrom.toISOString()),
    supabase
      .from("appointments")
      .select("start_time,end_time,status")
      .in("status", ["confirmed", "completed"])
      .lt("start_time", windowTo.toISOString())
      .gt("end_time", windowFrom.toISOString()),
  ]);
  if (whRes.error || blockRes.error || apptRes.error) {
    return { ok: false, error: "db_error", status: 500 };
  }

  const slots = computeAvailableSlots({
    dateFrom: windowFrom,
    dateTo: windowTo,
    now: new Date(),
    config: {
      durationMinutes: type.duration_minutes,
      bufferMinutes: settings.buffer_minutes,
      minBookingHoursAhead: settings.min_booking_hours_ahead,
      maxBookingDaysAhead: settings.max_booking_days_ahead,
    },
    workingHours: whRes.data ?? [],
    blockedPeriods: (blockRes.data ?? []).map((b) => ({
      start_time: new Date(b.start_time),
      end_time: new Date(b.end_time),
    })),
    existingAppointments: (apptRes.data ?? []).map((a) => ({
      start_time: new Date(a.start_time),
      end_time: new Date(a.end_time),
    })),
  });

  const matches = slots.some(
    (s) => s.start.getTime() === startTime.getTime(),
  );
  if (!matches) {
    return { ok: false, error: "slot_unavailable", status: 409 };
  }

  // 3. Upsert patient by email (lowercase). If exists, set is_new=false.
  const emailLower = input.patient.email.toLowerCase();
  const { data: existing, error: existingErr } = await supabase
    .from("patients")
    .select("id,is_new")
    .ilike("email", emailLower)
    .maybeSingle();
  if (existingErr) {
    return { ok: false, error: "db_error", status: 500 };
  }

  let patientId: string;
  let isNewPatient: boolean;
  if (existing) {
    patientId = existing.id;
    isNewPatient = false;
    await supabase
      .from("patients")
      .update({
        full_name: input.patient.full_name,
        phone: input.patient.phone,
        sport: input.patient.sport ?? null,
        is_new: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);
  } else {
    const { data: created, error: createErr } = await supabase
      .from("patients")
      .insert({
        full_name: input.patient.full_name,
        email: emailLower,
        phone: input.patient.phone,
        sport: input.patient.sport ?? null,
        is_new: true,
      })
      .select("id")
      .single();
    if (createErr || !created) {
      return { ok: false, error: "patient_create_failed", status: 500 };
    }
    patientId = created.id;
    isNewPatient = true;
  }

  // 4. Insert appointment
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      appointment_type_id: input.appointment_type_id,
      modality: input.modality,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      payment_status: settings.payments_enabled ? "unpaid" : "not_applicable",
      patient_reason: input.patient_reason ?? null,
      questionnaire_response: input.questionnaire_response ?? null,
    })
    .select("id,cancellation_token,start_time,end_time,meet_link")
    .single();
  if (apptErr || !appt) {
    return { ok: false, error: "appointment_create_failed", status: 500 };
  }

  // 5. Notifications (fire-and-log; failure does NOT undo booking)
  const typeName =
    input.locale === "en" && type.name_en ? type.name_en : type.name_es;
  const formattedDate = formatTz(
    appt.start_time,
    input.locale === "es" ? "EEEE d 'de' MMMM yyyy" : "EEEE, MMMM d, yyyy",
    input.locale,
  );
  const formattedTime = formatTz(appt.start_time, "HH:mm");
  const manageUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/cita/${appt.cancellation_token}`;
  const policy =
    input.locale === "es"
      ? settings.cancellation_policy_es
      : settings.cancellation_policy_en;

  if (settings.notify_email_on_booking) {
    await sendEmail({
      to: input.patient.email,
      subject:
        input.locale === "es"
          ? `Tu cita está confirmada — ${formattedDate}`
          : `Your appointment is confirmed — ${formattedDate}`,
      recipientType: "patient",
      appointmentId: appt.id,
      templateKey: "booking_confirmation_patient",
      react: BookingConfirmationPatient({
        locale: input.locale,
        patientName: input.patient.full_name,
        appointmentTypeName: typeName,
        formattedDate,
        formattedTime,
        modality: input.modality,
        meetLink: appt.meet_link ?? null,
        manageUrl,
        cancellationPolicy: policy,
        brandName: brand.name,
      }),
    });
  }

  const adminEmail =
    settings.admin_notification_email?.trim() ||
    serverEnv().ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail && settings.notify_email_on_booking) {
    await sendEmail({
      to: adminEmail,
      subject: `Nueva cita: ${input.patient.full_name} — ${formattedDate}`,
      recipientType: "admin",
      appointmentId: appt.id,
      templateKey: "booking_notification_admin",
      react: BookingNotificationAdmin({
        patientName: input.patient.full_name,
        patientEmail: input.patient.email,
        patientPhone: input.patient.phone,
        patientSport: input.patient.sport,
        isNew: isNewPatient,
        appointmentTypeName: typeName,
        formattedDate,
        formattedTime,
        modality: input.modality,
        patientReason: input.patient_reason,
      }),
    });
  }

  return {
    ok: true,
    appointment_id: appt.id,
    cancellation_token: appt.cancellation_token,
    end_time: appt.end_time,
  };
}

export async function cancelAppointmentByToken(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const supabase = createAdminClient();
  const settings = await getSettings();

  const { data: appt, error } = await supabase
    .from("appointments")
    .select(
      "id,start_time,status,patient_id,appointment_type_id, patients ( full_name, email ), appointment_types ( name_es, name_en )",
    )
    .eq("cancellation_token", token)
    .maybeSingle();
  if (error || !appt) {
    return { ok: false, error: "not_found", status: 404 };
  }
  if (appt.status !== "confirmed") {
    return { ok: false, error: "not_cancellable", status: 409 };
  }
  const hoursAhead =
    (new Date(appt.start_time).getTime() - Date.now()) / 3600_000;
  if (hoursAhead < settings.cancellation_hours_limit) {
    return { ok: false, error: "too_late", status: 422 };
  }

  const { error: updErr } = await supabase
    .from("appointments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", appt.id);
  if (updErr) {
    return { ok: false, error: "db_error", status: 500 };
  }

  const patient = Array.isArray(appt.patients)
    ? appt.patients[0]
    : appt.patients;
  const type = Array.isArray(appt.appointment_types)
    ? appt.appointment_types[0]
    : appt.appointment_types;
  if (patient && type) {
    const typeName = type.name_es;
    const formattedDate = formatTz(
      appt.start_time,
      "EEEE d 'de' MMMM yyyy",
      "es",
    );
    const formattedTime = formatTz(appt.start_time, "HH:mm");
    if (settings.notify_email_on_cancellation) {
      await sendEmail({
        to: patient.email,
        subject: `Cita cancelada — ${formattedDate}`,
        recipientType: "patient",
        appointmentId: appt.id,
        templateKey: "cancellation_patient",
        react: CancellationEmail({
          locale: "es",
          recipientType: "patient",
          patientName: patient.full_name,
          appointmentTypeName: typeName,
          formattedDate,
          formattedTime,
        }),
      });
    }
    const adminEmail =
      settings.admin_notification_email?.trim() ||
      serverEnv().ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail && settings.notify_email_on_cancellation) {
      await sendEmail({
        to: adminEmail,
        subject: `Cita cancelada: ${patient.full_name} — ${formattedDate}`,
        recipientType: "admin",
        appointmentId: appt.id,
        templateKey: "cancellation_admin",
        react: CancellationEmail({
          locale: "es",
          recipientType: "admin",
          patientName: patient.full_name,
          appointmentTypeName: typeName,
          formattedDate,
          formattedTime,
        }),
      });
    }
  }

  return { ok: true };
}

/* ===========================================================
 * Admin-side booking — for manual entries by the nutritionist
 * (e.g. a returning patient confirms by phone).
 * Differences vs public flow:
 *   - May bind to an existing patient_id (no upsert)
 *   - Skips `min_booking_hours_ahead` (admin can book today/now)
 *   - Caller controls whether to send the confirmation email
 *   - Records `created_by` to the admin profile id
 * =========================================================== */

export type CreateAdminAppointmentInput = {
  appointment_type_id: string;
  modality: "in_person" | "virtual";
  start_time: string; // ISO UTC
  /** Either an existing patient ID or new patient details (one is required). */
  patient_id?: string;
  patient_new?: {
    full_name: string;
    email: string;
    phone: string;
    sport?: string;
  };
  admin_notes?: string;
  patient_reason?: string;
  /** Optional. If provided, stored on the appointment and included in the confirmation email. */
  meet_link?: string | null;
  send_confirmation_email: boolean;
  created_by: string; // admin profile id
};

export type CreateAdminAppointmentResult =
  | {
      ok: true;
      appointment_id: string;
      cancellation_token: string;
      patient_id: string;
    }
  | { ok: false; error: string; status: number };

export async function createAdminAppointment(
  input: CreateAdminAppointmentInput,
): Promise<CreateAdminAppointmentResult> {
  if (!input.patient_id && !input.patient_new) {
    return {
      ok: false,
      error: "patient_id_or_new_required",
      status: 400,
    };
  }

  const supabase = createAdminClient();
  const brand = await getBrand();
  const startTime = new Date(input.start_time);

  // 1. Load type + settings
  const [{ data: type, error: typeErr }, settings] = await Promise.all([
    supabase
      .from("appointment_types")
      .select("id,duration_minutes,name_es,name_en,is_active")
      .eq("id", input.appointment_type_id)
      .single(),
    getSettings(),
  ]);
  if (typeErr || !type) {
    return { ok: false, error: "appointment_type_not_found", status: 404 };
  }

  const endTime = new Date(
    startTime.getTime() + type.duration_minutes * 60_000,
  );

  // 2. Re-check availability — but admin can override min_booking_hours_ahead
  // by using a `now` far in the past in the slot computation.
  // We still enforce: no overlap with existing booking, no blocked period,
  // and slot must be inside a working_hours window. (Admin can edit
  // working_hours if they need to book outside, by design.)
  const windowFrom = new Date(startTime.getTime() - 24 * 3600_000);
  const windowTo = new Date(endTime.getTime() + 24 * 3600_000);

  const [whRes, blockRes, apptRes] = await Promise.all([
    supabase
      .from("working_hours")
      .select("day_of_week,start_time,end_time,is_active")
      .eq("is_active", true),
    supabase
      .from("blocked_periods")
      .select("start_time,end_time")
      .lt("start_time", windowTo.toISOString())
      .gt("end_time", windowFrom.toISOString()),
    supabase
      .from("appointments")
      .select("start_time,end_time,status")
      .in("status", ["confirmed", "completed"])
      .lt("start_time", windowTo.toISOString())
      .gt("end_time", windowFrom.toISOString()),
  ]);
  if (whRes.error || blockRes.error || apptRes.error) {
    return { ok: false, error: "db_error", status: 500 };
  }

  const slots = computeAvailableSlots({
    dateFrom: windowFrom,
    dateTo: windowTo,
    // Real `now`; admin bypass is purely via the relaxed config limits.
    // (Passing now=0 here would collapse maxBookingInstant to 1980 and
    // make effectiveTo < windowFrom, returning zero slots.)
    now: new Date(),
    config: {
      durationMinutes: type.duration_minutes,
      bufferMinutes: settings.buffer_minutes,
      minBookingHoursAhead: 0,
      maxBookingDaysAhead: 3650, // ~10 years
    },
    workingHours: whRes.data ?? [],
    blockedPeriods: (blockRes.data ?? []).map((b) => ({
      start_time: new Date(b.start_time),
      end_time: new Date(b.end_time),
    })),
    existingAppointments: (apptRes.data ?? []).map((a) => ({
      start_time: new Date(a.start_time),
      end_time: new Date(a.end_time),
    })),
  });

  const matches = slots.some(
    (s) => s.start.getTime() === startTime.getTime(),
  );
  if (!matches) {
    return { ok: false, error: "slot_unavailable", status: 409 };
  }

  // 3. Resolve patient
  let patientId: string;
  let patientEmail: string;
  let patientName: string;
  let isNewPatient = false;
  if (input.patient_id) {
    const { data: existing, error } = await supabase
      .from("patients")
      .select("id,full_name,email")
      .eq("id", input.patient_id)
      .single();
    if (error || !existing) {
      return { ok: false, error: "patient_not_found", status: 404 };
    }
    patientId = existing.id;
    patientEmail = existing.email;
    patientName = existing.full_name;
    // Returning visit: ensure is_new=false
    await supabase
      .from("patients")
      .update({ is_new: false, updated_at: new Date().toISOString() })
      .eq("id", patientId);
  } else {
    const newP = input.patient_new!;
    const emailLower = newP.email.toLowerCase();
    // Try existing first to avoid duplicates
    const { data: existing } = await supabase
      .from("patients")
      .select("id,full_name,email")
      .ilike("email", emailLower)
      .maybeSingle();
    if (existing) {
      patientId = existing.id;
      patientEmail = existing.email;
      patientName = existing.full_name;
      await supabase
        .from("patients")
        .update({
          full_name: newP.full_name,
          phone: newP.phone,
          sport: newP.sport ?? null,
          is_new: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", patientId);
    } else {
      const { data: created, error: createErr } = await supabase
        .from("patients")
        .insert({
          full_name: newP.full_name,
          email: emailLower,
          phone: newP.phone,
          sport: newP.sport ?? null,
          is_new: true,
        })
        .select("id,full_name,email")
        .single();
      if (createErr || !created) {
        return { ok: false, error: "patient_create_failed", status: 500 };
      }
      patientId = created.id;
      patientEmail = created.email;
      patientName = created.full_name;
      isNewPatient = true;
    }
  }

  // 4. Insert appointment
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      appointment_type_id: input.appointment_type_id,
      modality: input.modality,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      payment_status: settings.payments_enabled ? "unpaid" : "not_applicable",
      patient_reason: input.patient_reason ?? null,
      admin_notes: input.admin_notes ?? null,
      meet_link: input.meet_link?.trim() ? input.meet_link.trim() : null,
      created_by: input.created_by,
    })
    .select("id,cancellation_token,meet_link")
    .single();
  if (apptErr || !appt) {
    return { ok: false, error: "appointment_create_failed", status: 500 };
  }

  // 5. Optional confirmation email to patient
  if (input.send_confirmation_email) {
    const typeName = type.name_es;
    const formattedDate = formatTz(
      startTime.toISOString(),
      "EEEE d 'de' MMMM yyyy",
      "es",
    );
    const formattedTime = formatTz(startTime.toISOString(), "HH:mm");
    const manageUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/cita/${appt.cancellation_token}`;
    const policy = settings.cancellation_policy_es;
    await sendEmail({
      to: patientEmail,
      subject: `Tu cita está confirmada — ${formattedDate}`,
      recipientType: "patient",
      appointmentId: appt.id,
      templateKey: "booking_confirmation_patient_admin",
      react: BookingConfirmationPatient({
        locale: "es",
        patientName,
        appointmentTypeName: typeName,
        formattedDate,
        formattedTime,
        modality: input.modality,
        meetLink: appt.meet_link ?? null,
        manageUrl,
        cancellationPolicy: policy,
        brandName: brand.name,
      }),
    });
  }

  void isNewPatient; // currently unused in admin flow, kept for future
  return {
    ok: true,
    appointment_id: appt.id,
    cancellation_token: appt.cancellation_token,
    patient_id: patientId,
  };
}

/** Helper for the admin-side patient autocomplete. */
export async function searchPatients(
  query: string,
  limit = 8,
): Promise<
  Array<{
    id: string;
    full_name: string;
    email: string;
    phone: string;
    sport: string | null;
  }>
> {
  if (!query || query.trim().length < 2) return [];
  const supabase = createAdminClient();
  const q = query.trim().replace(/[%_]/g, "");
  const { data } = await supabase
    .from("patients")
    .select("id,full_name,email,phone,sport")
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<{
    id: string;
    full_name: string;
    email: string;
    phone: string;
    sport: string | null;
  }>;
}
