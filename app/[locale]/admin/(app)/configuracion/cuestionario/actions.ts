"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

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
  question_es: z.string().min(1).max(500),
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

export async function upsertQuestion(formData: FormData) {
  await requireProfile();
  const optionsRaw = String(formData.get("options") ?? "").trim();
  const options = optionsRaw
    ? optionsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  const parsed = upsertSchema.parse({
    id: (formData.get("id") as string) || undefined,
    question_es: String(formData.get("question_es") ?? ""),
    question_en: nullableText(formData.get("question_en")),
    field_type: formData.get("field_type"),
    options: options && options.length > 0 ? options : null,
    is_required: formData.get("is_required") === "on",
    is_active: formData.get("is_active") === "on",
  });

  const supabase = createAdminClient();
  if (parsed.id) {
    await supabase
      .from("questionnaire_questions")
      .update({
        question_es: parsed.question_es,
        question_en: parsed.question_en,
        field_type: parsed.field_type,
        options: parsed.options,
        is_required: parsed.is_required,
        is_active: parsed.is_active,
      })
      .eq("id", parsed.id);
  } else {
    // Compute next sort_order
    const { data: max } = await supabase
      .from("questionnaire_questions")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort_order = (max?.sort_order ?? 0) + 1;
    await supabase.from("questionnaire_questions").insert({
      question_es: parsed.question_es,
      question_en: parsed.question_en,
      field_type: parsed.field_type,
      options: parsed.options,
      is_required: parsed.is_required,
      is_active: parsed.is_active,
      sort_order,
    });
  }
  revalidatePath("/admin/configuracion/cuestionario");
  revalidatePath("/agendar");
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
  // Validate all UUIDs
  const ids = z.array(z.string().uuid()).parse(orderedIds);
  const supabase = createAdminClient();
  // Single-tx update via array RPC would be ideal; for now do parallel updates.
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
