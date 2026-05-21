import { z } from "zod";

/** Schemas shared between server (validation) and client (RHF). */

export const isoDateTimeSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Invalid ISO timestamp",
  });

export const availabilityQuerySchema = z.object({
  appointment_type_id: z.string().uuid(),
  date_from: isoDateTimeSchema,
  date_to: isoDateTimeSchema,
});

export const modalitySchema = z.enum(["in_person", "virtual"]);

export const patientSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(30),
  sport: z.string().max(120).optional(),
});

/** Each questionnaire response is keyed by question UUID. */
export const questionnaireResponseSchema = z.record(
  z.string().uuid(),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
);

export const createAppointmentSchema = z.object({
  appointment_type_id: z.string().uuid(),
  modality: modalitySchema,
  start_time: isoDateTimeSchema, // proposed UTC instant
  patient: patientSchema,
  patient_reason: z.string().max(2000).optional(),
  questionnaire_response: questionnaireResponseSchema.optional(),
  locale: z.enum(["es", "en"]).default("es"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  token: z.string().min(8),
});

export const rescheduleAppointmentSchema = z.object({
  token: z.string().min(8),
  start_time: isoDateTimeSchema,
});
