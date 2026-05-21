import { createAdminClient } from "@/lib/supabase/admin";
import { QuestionForm, type Question } from "./question-form";
import { SortableQuestionsList } from "./sortable-list";

export const dynamic = "force-dynamic";

export default async function CuestionarioPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("questionnaire_questions")
    .select("*")
    .order("sort_order", { ascending: true });

  const questions = (data ?? []) as Question[];

  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold">Cuestionario pre-consulta</h2>
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            Preguntas que se muestran a pacientes nuevos al agendar su primera
            consulta. Arrástralas para reordenar.
          </p>
        </div>
        <QuestionForm />
      </header>

      <SortableQuestionsList initial={questions} />
    </section>
  );
}
