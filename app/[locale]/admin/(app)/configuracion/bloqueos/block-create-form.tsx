"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  INITIAL_SETTINGS_STATE,
  type SettingsActionState,
} from "@/lib/admin-form-state";
import { createBlock } from "./actions";

export function BlockCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(createBlock, INITIAL_SETTINGS_STATE);
  const lastTs = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.ts || state.ts === lastTs.current) return;
    lastTs.current = state.ts;
    if (state.ok) {
      toast.success(state.message ?? "Bloqueo creado");
      formRef.current?.reset();
    } else {
      toast.error(state.message ?? "No se pudo crear el bloqueo");
    }
  }, [state]);

  const e = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start"
    >
      <Field label="Inicio" error={e.start_local}>
        <input
          type="datetime-local"
          name="start_local"
          required
          className="form-input"
        />
      </Field>
      <Field label="Fin" error={e.end_local}>
        <input
          type="datetime-local"
          name="end_local"
          required
          className="form-input"
        />
      </Field>
      <Field
        label="Motivo (opcional)"
        help="Solo para tu referencia. No se muestra al paciente."
        maxLength={200}
        error={e.reason}
      >
        <input
          type="text"
          name="reason"
          maxLength={200}
          placeholder="Vacaciones, congreso…"
          className="form-input"
        />
      </Field>
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
        Crear
      </Button>
    </form>
  );
}
