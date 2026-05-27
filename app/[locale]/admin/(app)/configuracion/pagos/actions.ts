"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { getPlan } from "@/lib/plan";
import {
  type SettingsActionState,
  zodIssuesToFieldErrors,
} from "@/lib/admin-form-state";

const schema = z.object({
  payments_enabled: z.boolean(),
  currency_code: z
    .string()
    .trim()
    .min(3, "Usa 3 letras (ej: MXN)")
    .max(3, "Usa 3 letras (ej: MXN)")
    .transform((v) => v.toUpperCase()),
  payment_methods: z
    .array(z.string().trim().min(1).max(60))
    .max(20, "Máximo 20 métodos"),
});

export async function savePaymentsSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    await requireProfile();
  } catch {
    return {
      ok: false,
      message: "Tu sesión expiró. Vuelve a iniciar sesión.",
      ts: Date.now(),
    };
  }

  if (!getPlan().allows("payments")) {
    return {
      ok: false,
      message: "Esta función no está disponible en tu plan actual.",
      ts: Date.now(),
    };
  }

  // payment_methods is sent as a JSON-encoded array in a single field
  // produced by the client component (keeps the server side trivial).
  let methods: unknown = [];
  try {
    methods = JSON.parse(String(formData.get("payment_methods") ?? "[]"));
  } catch {
    methods = [];
  }

  const parsed = schema.safeParse({
    payments_enabled: formData.get("payments_enabled") === "on",
    currency_code: String(formData.get("currency_code") ?? "MXN"),
    payment_methods: Array.isArray(methods) ? methods : [],
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos del formulario.",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      ts: Date.now(),
    };
  }

  // De-duplicate methods while preserving order
  const seen = new Set<string>();
  const cleanedMethods = parsed.data.payment_methods.filter((m) => {
    const key = m.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const ts = new Date().toISOString();
  const rows = [
    { key: "payments_enabled", value: parsed.data.payments_enabled, updated_at: ts },
    { key: "currency_code", value: parsed.data.currency_code, updated_at: ts },
    { key: "payment_methods", value: cleanedMethods, updated_at: ts },
  ];

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("settings")
      .upsert(rows, { onConflict: "key" });
    if (error) throw error;
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `No se pudo guardar: ${err.message}`
          : "No se pudo guardar la configuración de pagos.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/pagos");
  revalidatePath("/admin/citas");
  revalidatePath("/admin/finanzas");
  return { ok: true, message: "Configuración de pagos guardada", ts: Date.now() };
}
