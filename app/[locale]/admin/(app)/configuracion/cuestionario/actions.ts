"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import {
  type SettingsActionState,
  zodIssuesToFieldErrors,
} from "@/lib/admin-form-state";

const fieldTypeEnum = z.enum([
  "text",
  "textarea",
  "number",
  "select",
  "checkbox",
  "date",
]);

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  question_es: z.string().min(1, "Escribe la pregunta en español").max(500),
  question_en: z.string().max(500).nullable().optional(),
  field_type: fieldTypeEnum,
  options: z.array(z.string()).optional().nullable(),
  is_required: z.boolean(),
  is_active: z.boolean(),
});

function nullableText(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length === 0 ? null : s;
}

export async function upsertQuestion(
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

  const optionsRaw = String(formData.get("options") ?? "").trim();
  const options = optionsRaw
    ? optionsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const parsed = upsertSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    question_es: String(formData.get("question_es") ?? ""),
    question_en: nullableText(formData.get("question_en")),
    field_type: formData.get("field_type"),
    options: options && options.length > 0 ? options : null,
    is_required: formData.get("is_required") === "on",
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      ts: Date.now(),
    };
  }

  try {
    const supabase = createAdminClient();
    if (parsed.data.id) {
      const { error } = await supabase
        .from("questionnaire_questions")
        .update({
          question_es: parsed.data.question_es,
          question_en: parsed.data.question_en,
          field_type: parsed.data.field_type,
          options: parsed.data.options,
          is_required: parsed.data.is_required,
          is_active: parsed.data.is_active,
        })
        .eq("id", parsed.data.id);
      if (error) throw error;
    } else {
      const { data: max } = await supabase
        .from("questionnaire_questions")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const sort_order = (max?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("questionnaire_questions").insert({
        question_es: parsed.data.question_es,
        question_en: parsed.data.question_en,
        field_type: parsed.data.field_type,
        options: parsed.data.options,
        is_required: parsed.data.is_required,
        is_active: parsed.data.is_active,
        sort_order,
      });
      if (error) throw error;
    }
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `No se pudo guardar: ${err.message}`
          : "No se pudo guardar la pregunta.",
      ts: Date.now(),
    };
  }

  revalidatePath("/admin/configuracion/cuestionario");
  revalidatePath("/agendar");
  return {
    ok: true,
    message: parsed.data.id ? "Pregunta actualizada" : "Pregunta creada",
    ts: Date.now(),
  };
}

export async function deleteQuestion(formData: FormData) {
  await requireProfile();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = createAdminClient();
  await supabase.from("questionnaire_questions").delete().eq("id", id);
  revalidatePath("/admin/configuracion/cuestionario");
  revalidatePath("/agendar");
}

export async function reorderQuestions(orderedIds: string[]) {
  await requireProfile();
  const ids = z.array(z.string().uuid()).parse(orderedIds);
  const supabase = createAdminClient();
  await Promise.all(
    ids.map((id, idx) =>
      supabase
        .from("questionnaire_questions")
        .update({ sort_order: idx + 1 })
        .eq("id", id),
    ),
  );
  revalidatePath("/admin/configuracion/cuestionario");
  revalidatePath("/agendar");
}
