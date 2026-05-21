import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const { RESEND_API_KEY } = serverEnv();
  if (!RESEND_API_KEY) return null;
  _resend = new Resend(RESEND_API_KEY);
  return _resend;
}

export type SendEmailParams = {
  to: string;
  subject: string;
  react: React.ReactElement;
  appointmentId?: string;
  recipientType: "patient" | "admin";
  templateKey: string;
};

/**
 * Send an email via Resend and log to `notification_log`.
 * Never throws — returns a result object so callers can decide how to react.
 */
export async function sendEmail(
  params: SendEmailParams,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResend();
  const env = serverEnv();
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  if (!resend) {
    return logAndReturn(params, "failed", "RESEND_API_KEY not configured");
  }
  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      react: params.react,
    });
    if (result.error) {
      return logAndReturn(params, "failed", result.error.message ?? "unknown");
    }
    await logToDb(params, "sent", undefined, result.data?.id);
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return logAndReturn(params, "failed", msg);
  }
}

async function logAndReturn(
  params: SendEmailParams,
  status: "sent" | "failed" | "queued",
  error?: string,
): Promise<{ ok: boolean; error?: string }> {
  await logToDb(params, status, error);
  return { ok: status === "sent", error };
}

async function logToDb(
  params: SendEmailParams,
  status: "sent" | "failed" | "queued",
  error?: string,
  externalId?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("notification_log").insert({
      appointment_id: params.appointmentId ?? null,
      channel: "email",
      recipient_type: params.recipientType,
      template_key: params.templateKey,
      status,
      payload: {
        to: params.to,
        subject: params.subject,
        external_id: externalId,
      },
      error_message: error ?? null,
    });
  } catch {
    // swallow — logging must not block primary flow
  }
}
