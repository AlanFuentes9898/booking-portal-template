"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import {
  createAdminAppointment,
  searchPatients,
} from "@/lib/appointments";

const schema = z.object({
  appointment_type_id: z.string().uuid(),
  modality: z.enum(["in_person", "virtual"]),
  start_time: z.string(),
  // EITHER an existing patient OR new patient fields
  patient_id: z.string().uuid().optional().nullable(),
  patient_full_name: z.string().optional(),
  patient_email: z.string().optional(),
  patient_phone: z.string().optional(),
  patient_sport: z.string().optional(),
  admin_notes: z.string().optional(),
  patient_reason: z.string().optional(),
  meet_link: z.string().max(500).optional(),
  send_confirmation_email: z.boolean(),
});

export type CreateAdminApptState = {
  ok: boolean;
  error: string | null;
  appointmentId?: string;
};

export async function createAdminAppointmentAction(
  _prev: CreateAdminApptState,
  formData: FormData,
): Promise<CreateAdminApptState> {
  const profile = await requireProfile();

  const parsed = schema.safeParse({
    appointment_type_id: formData.get("appointment_type_id"),
    modality: formData.get("modality"),
    start_time: formData.get("start_time"),
    patient_id: (formData.get("patient_id") as string) || null,
    patient_full_name: (formData.get("patient_full_name") as string) || undefined,
    patient_email: (formData.get("patient_email") as string) || undefined,
    patient_phone: (formData.get("patient_phone") as string) || undefined,
    patient_sport: (formData.get("patient_sport") as string) || undefined,
    admin_notes: (formData.get("admin_notes") as string) || undefined,
    patient_reason: (formData.get("patient_reason") as string) || undefined,
    meet_link: (formData.get("meet_link") as string) || undefined,
    send_confirmation_email:
      formData.get("send_confirmation_email") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const v = parsed.data;
  const hasExisting = !!v.patient_id;
  const hasNew = !!(v.patient_full_name && v.patient_email && v.patient_phone);
  if (!hasExisting && !hasNew) {
    return { ok: false, error: "patient_required" };
  }

  const result = await createAdminAppointment({
    appointment_type_id: v.appointment_type_id,
    modality: v.modality,
    start_time: v.start_time,
    patient_id: v.patient_id ?? undefined,
    patient_new: hasExisting
      ? undefined
      : {
          full_name: v.patient_full_name!,
          email: v.patient_email!,
          phone: v.patient_phone!,
          sport: v.patient_sport || undefined,
        },
    admin_notes: v.admin_notes || undefined,
    patient_reason: v.patient_reason || undefined,
    meet_link: v.modality === "virtual" ? v.meet_link || null : null,
    send_confirmation_email: v.send_confirmation_email,
    created_by: profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/citas");
  revalidatePath("/admin/calendario");
  revalidatePath(`/admin/pacientes/${result.patient_id}`);
  redirect(`/admin/citas/${result.appointment_id}`);
}

export async function searchPatientsAction(query: string) {
  await requireProfile();
  return searchPatients(query);
}
