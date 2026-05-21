"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
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
  const isEdit = !!question;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        <form
          action={async (fd) => {
            await upsertQuestion(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          {question && <input type="hidden" name="id" value={question.id} />}

          <Field label="Pregunta (ES) *">
            <textarea
              name="question_es"
              required
              rows={2}
              defaultValue={question?.question_es}
              maxLength={500}
              className="form-input"
            />
          </Field>
          <Field label="Question (EN)">
            <textarea
              name="question_en"
              rows={2}
              defaultValue={question?.question_en ?? ""}
              maxLength={500}
              className="form-input"
            />
          </Field>

          <Field label="Tipo de campo">
            <select
              name="field_type"
              value={fieldType}
              onChange={(e) =>
                setFieldType(e.target.value as Question["field_type"])
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
            <Field label="Opciones (una por línea)">
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
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">
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
          `}</style>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider font-semibold text-[color:var(--color-brand-muted)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
