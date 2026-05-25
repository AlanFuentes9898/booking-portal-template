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
import { upsertAppointmentType } from "./actions";

export type AppointmentTypeRow = {
  id: string;
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
  duration_minutes: number;
  price_mxn: number | null;
  is_for_new_patients: boolean;
  is_active: boolean;
  sort_order: number;
};

export function TypeForm({
  type,
  triggerLabel,
}: {
  type?: AppointmentTypeRow;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!type;

  const { state, formAction, pending } = useDialogAction(
    upsertAppointmentType,
    {
      onOpenChange: setOpen,
      formRef,
      successMessage: isEdit ? "Tipo actualizado" : "Tipo creado",
      resetOnSuccess: !isEdit,
    },
  );
  const e = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button
            type="button"
            className="text-sm text-[color:var(--color-brand-pink)] hover:underline inline-flex items-center gap-1"
          >
            <Pencil size={13} /> Editar
          </button>
        ) : (
          <Button>
            <Plus size={15} /> {triggerLabel ?? "Nuevo tipo"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar tipo de cita" : "Nuevo tipo de cita"}
          </DialogTitle>
          <DialogDescription>
            Los campos en inglés son opcionales — se usa el español si no hay
            traducción.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {type && <input type="hidden" name="id" value={type.id} />}

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Nombre (ES) *"
              help="Cómo se llama este tipo de cita en español. Aparece en el flujo de reserva."
              maxLength={120}
              defaultValue={type?.name_es ?? ""}
              error={e.name_es}
            >
              <input
                name="name_es"
                required
                maxLength={120}
                defaultValue={type?.name_es}
                className="form-input"
              />
            </Field>
            <Field
              label="Name (EN)"
              help="English label. Leave empty to fall back to the Spanish name."
              maxLength={120}
              defaultValue={type?.name_en ?? ""}
              error={e.name_en}
            >
              <input
                name="name_en"
                maxLength={120}
                defaultValue={type?.name_en ?? ""}
                className="form-input"
              />
            </Field>
          </div>

          <Field
            label="Descripción (ES)"
            help="Texto breve que el paciente ve junto al nombre del tipo de cita en el flujo de reserva."
            maxLength={500}
            defaultValue={type?.description_es ?? ""}
            error={e.description_es}
          >
            <textarea
              name="description_es"
              rows={2}
              maxLength={500}
              defaultValue={type?.description_es ?? ""}
              className="form-input"
            />
          </Field>
          <Field
            label="Description (EN)"
            help="Short blurb in English shown next to the type name."
            maxLength={500}
            defaultValue={type?.description_en ?? ""}
            error={e.description_en}
          >
            <textarea
              name="description_en"
              rows={2}
              maxLength={500}
              defaultValue={type?.description_en ?? ""}
              className="form-input"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Duración (min) *"
              help="Cuánto dura este tipo de cita. Define el largo de los bloques del calendario."
              error={e.duration_minutes}
            >
              <input
                name="duration_minutes"
                type="number"
                min="5"
                max="480"
                required
                defaultValue={type?.duration_minutes ?? 30}
                className="form-input tabular-nums"
              />
            </Field>
            <Field
              label="Precio MXN"
              help="Precio en pesos mexicanos. Deja vacío si no quieres mostrar precio."
              error={e.price_mxn}
            >
              <input
                name="price_mxn"
                type="number"
                step="1"
                min="0"
                defaultValue={type?.price_mxn ?? ""}
                placeholder="(vacío)"
                className="form-input tabular-nums"
              />
            </Field>
            <Field
              label="Orden"
              help="Posición en la lista. Menor número = aparece primero."
              error={e.sort_order}
            >
              <input
                name="sort_order"
                type="number"
                min="0"
                defaultValue={type?.sort_order ?? 0}
                className="form-input tabular-nums"
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_for_new_patients"
                defaultChecked={type?.is_for_new_patients ?? false}
                className="size-4 accent-[color:var(--color-brand-green)]"
              />
              Es para pacientes nuevos (dispara cuestionario)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={type?.is_active ?? true}
                className="size-4 accent-[color:var(--color-brand-green)]"
              />
              Activo (visible para agendar)
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
              {isEdit ? "Guardar cambios" : "Crear tipo"}
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
