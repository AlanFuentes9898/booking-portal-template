"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPlan } from "@/lib/plan";
import { getBrand } from "@/lib/brand";
import { sendEmail } from "@/lib/email";
import { formatTz } from "@/lib/time";
import { publicEnv } from "@/lib/env";
import { BookingConfirmationPatient } from "@/emails/booking-confirmation-patient";

const idSchema = z.string().uuid();
const statusSchema = z.enum([
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export async function updateAppointmentStatus(formData: FormData) {
  await requireProfile();
  const id = idSchema.parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  const supabase = createAdminClient();
  await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/admin/citas/${id}`);
  revalidatePath("/admin/citas");
  revalidatePath("/admin");
}

export async function updateAdminNotes(formData: FormData) {
  await requireProfile();
  const id = idSchema.parse(formData.get("id"));
  const notes = String(formData.get("admin_notes") ?? "").slice(0, 4000);
  const supabase = createAdminClient();
  await supabase
    .from("appointments")
    .update({
      admin_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath(`/admin/citas/${id}`);
}

const paymentSchema = z.object({
  id: z.string().uuid(),
  payment_status: z.enum(["unpaid", "paid", "refunded", "not_applicable"]),
  amount_paid: z
    .union([z.string(), z.number()])
    .transform((v) =>
      v === "" || v === null || v === undefined ? null : Number(v),
    )
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), {
      message: "Monto inválido",
    }),
  payment_method: z.string().max(60).optional().nullable(),
  paid_at: z.string().optional().nullable(),
});

export async function updateAppointmentPayment(formData: FormData) {
  await requireProfile();
  if (!getPlan().allows("payments")) {
    throw new Error("Función no disponible en tu plan actual.");
  }
  const parsed = paymentSchema.parse({
    id: formData.get("id"),
    payment_status: formData.get("payment_status"),
    amount_paid: formData.get("amount_paid") ?? null,
    payment_method: (formData.get("payment_method") as string) || null,
    paid_at: (formData.get("paid_at") as string) || null,
  });

  // When marking as paid we want a sensible paid_at (today if missing).
  // When marking as unpaid/refunded/not_applicable we clear the payment metadata.
  let paid_at: string | null = null;
  let payment_method: string | null = null;
  let amount_paid: number | null = parsed.amount_paid;
  if (parsed.payment_status === "paid") {
    paid_at = parsed.paid_at
      ? new Date(parsed.paid_at).toISOString()
      : new Date().toISOString();
    payment_method = parsed.payment_method ?? null;
  } else if (parsed.payment_status === "refunded") {
    paid_at = parsed.paid_at
      ? new Date(parsed.paid_at).toISOString()
      : new Date().toISOString();
    payment_method = parsed.payment_method ?? null;
  } else {
    amount_paid = null;
  }

  const supabase = createAdminClient();
  await supabase
    .from("appointments")
    .update({
      payment_status: parsed.payment_status,
      amount_paid,
      payment_method,
      paid_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.id);

  revalidatePath(`/admin/citas/${parsed.id}`);
  revalidatePath("/admin/citas");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin");
}

const meetLinkSchema = z.object({
  id: z.string().uuid(),
  meet_link: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export async function updateAppointmentMeetLink(formData: FormData) {
  await requireProfile();
  const parsed = meetLinkSchema.parse({
    id: formData.get("id"),
    meet_link: (formData.get("meet_link") as string) || null,
  });
  const supabase = createAdminClient();
  await supabase
    .from("appointments")
    .update({
      meet_link: parsed.meet_link,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.id);
  revalidatePath(`/admin/citas/${parsed.id}`);
  revalidatePath("/admin/citas");
}

export async function resendBookingEmail(formData: FormData) {
  await requireProfile();
  const id = idSchema.parse(formData.get("id"));

  const supabase = createAdminClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select(
      "id,start_time,modality,meet_link,cancellation_token, patients ( full_name, email ), appointment_types ( name_es )",
    )
    .eq("id", id)
    .maybeSingle();
  if (!appt) return;

  const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
  const type = Array.isArray(appt.appointment_types)
    ? appt.appointment_types[0]
    : appt.appointment_types;
  if (!patient || !type) return;

  const [settings, brand] = await Promise.all([getSettings(), getBrand()]);
  const formattedDate = formatTz(
    appt.start_time as string,
    "EEEE d 'de' MMMM yyyy",
    "es",
  );
  const formattedTime = formatTz(appt.start_time as string, "HH:mm");
  const manageUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/cita/${appt.cancellation_token}`;

  await sendEmail({
    to: patient.email,
    subject: `Tu cita está confirmada — ${formattedDate}`,
    recipientType: "patient",
    appointmentId: appt.id,
    templateKey: "booking_confirmation_patient_resend",
    react: BookingConfirmationPatient({
      locale: "es",
      patientName: patient.full_name,
      appointmentTypeName: type.name_es,
      formattedDate,
      formattedTime,
      modality: appt.modality as "in_person" | "virtual",
      meetLink: appt.meet_link as string | null,
      manageUrl,
      cancellationPolicy: settings.cancellation_policy_es,
      brandName: brand.name,
    }),
  });

  revalidatePath(`/admin/citas/${id}`);
}
