"use client";

import { useRef, useState } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { useDialogAction } from "@/components/admin/use-dialog-action";
import { upsertQuestion } from "./actions";

export type Question = {
  id: string;
  question_es: string;
  question_en: string | null;
  field_type: "text" | "textarea" | "number" | "select" | "checkbox" | "date";
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
};

const FIELD_TYPE_LABELS: Record<Question["field_type"], string> = {
  text: "Texto corto",
  textarea: "Texto largo",
  number: "Número",
  select: "Lista desplegable",
  checkbox: "Sí / No",
  date: "Fecha",
};

export { FIELD_TYPE_LABELS };

export function QuestionForm({ question }: { question?: Question }) {
  const [open, setOpen] = useState(false);
  const [fieldType, setFieldType] = useState<Question["field_type"]>(
    question?.field_type ?? "textarea",
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!question;

  const { state, formAction, pending } = useDialogAction(upsertQuestion, {
    onOpenChange: setOpen,
    formRef,
    successMessage: isEdit ? "Pregunta actualizada" : "Pregunta creada",
    resetOnSuccess: !isEdit,
  });
  const e = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button
            type="button"
            className="text-xs inline-flex items-center gap-1 text-[color:var(--color-brand-pink)] hover:underline"
          >
            <Pencil size={12} /> Editar
          </button>
        ) : (
          <Button>
            <Plus size={15} /> Nueva pregunta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar pregunta" : "Nueva pregunta"}
          </DialogTitle>
          <DialogDescription>
            Se muestra solo en la primera consulta de pacientes nuevos.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {question && <input type="hidden" name="id" value={question.id} />}

          <Field
            label="Pregunta (ES) *"
            help="Texto exacto que verá el paciente. Hasta 500 caracteres."
            maxLength={500}
            defaultValue={question?.question_es ?? ""}
            error={e.question_es}
          >
            <textarea
              name="question_es"
              required
              rows={2}
              defaultValue={question?.question_es}
              maxLength={500}
              className="form-input"
            />
          </Field>
          <Field
            label="Question (EN)"
            help="Optional English version. Leave empty to show only the Spanish text."
            maxLength={500}
            defaultValue={question?.question_en ?? ""}
            error={e.question_en}
          >
            <textarea
              name="question_en"
              rows={2}
              defaultValue={question?.question_en ?? ""}
              maxLength={500}
              className="form-input"
            />
          </Field>

          <Field
            label="Tipo de campo"
            help="Define cómo responde el paciente: texto corto, texto largo (varias líneas), número, lista de opciones, sí/no, o fecha."
          >
            <select
              name="field_type"
              value={fieldType}
              onChange={(ev) =>
                setFieldType(ev.target.value as Question["field_type"])
              }
              className="form-input"
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {fieldType === "select" && (
            <Field
              label="Opciones (una por línea)"
              help="Cada línea aparece como una opción seleccionable."
            >
              <textarea
                name="options"
                rows={4}
                defaultValue={question?.options?.join("\n") ?? ""}
                placeholder={"Opción 1\nOpción 2\nOpción 3"}
                className="form-input font-mono text-xs"
              />
            </Field>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_required"
                defaultChecked={question?.is_required ?? false}
                className="size-4 accent-[color:var(--color-brand-green)]"
              />
              Obligatoria
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={question?.is_active ?? true}
                className="size-4 accent-[color:var(--color-brand-green)]"
              />
              Activa (se muestra al paciente)
            </label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" size={14} />}
              {isEdit ? "Guardar" : "Crear pregunta"}
            </Button>
          </DialogFooter>

          <style>{`
            .form-input {
              width: 100%;
              padding: 9px 12px;
              border-radius: 10px;
              border: 1px solid rgba(42,42,42,0.15);
              background: white;
              font-size: 14px;
              outline: none;
            }
            .form-input:focus {
              border-color: var(--color-brand-green);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
            }
            .form-input[aria-invalid="true"] {
              border-color: var(--color-brand-pink);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-pink) 25%, transparent);
            }
          `}</style>
        </form>
      </DialogContent>
    </Dialog>
  );
}
