"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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
import { inviteUser, type InviteResult } from "./actions";

const initial: InviteResult = { ok: false, error: null };

export function InviteForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(inviteUser, initial);
  const formRef = useRef<HTMLFormElement>(null);
  // Distinct submission counter so the effect refires even on repeat errors.
  const submissionId = useRef(0);
  const lastSeenId = useRef(0);

  useEffect(() => {
    // useActionState swaps `state` ref on every response — count it.
    submissionId.current += 1;
    if (submissionId.current === lastSeenId.current) return;
    if (submissionId.current === 1) {
      // first render with initial state, skip
      lastSeenId.current = 1;
      return;
    }
    lastSeenId.current = submissionId.current;

    if (state.ok) {
      toast.success("Usuario creado. Se envió email para establecer contraseña.");
      setOpen(false);
      formRef.current?.reset();
    } else if (state.error) {
      const friendly =
        state.error === "create_failed"
          ? "No se pudo crear el usuario. Verifica que el email no esté registrado."
          : state.error === "invalid_input"
            ? "Revisa los datos: el email y el nombre son obligatorios."
            : state.error;
      toast.error(friendly);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={15} /> Invitar usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar nuevo usuario</DialogTitle>
          <DialogDescription>
            Crea una cuenta para tu equipo. El nuevo usuario recibirá un email
            para establecer su contraseña.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <Field
            label="Nombre completo"
            help="Como aparecerá en el sidebar admin y en emails internos."
            maxLength={120}
          >
            <input
              name="full_name"
              required
              maxLength={120}
              className="form-input"
            />
          </Field>
          <Field
            label="Email"
            help="El usuario recibirá aquí el link para crear su contraseña."
          >
            <input
              type="email"
              name="email"
              required
              className="form-input"
            />
          </Field>
          <Field
            label="Rol"
            help="Owner = control total (puede crear otros usuarios). Asistente = puede gestionar citas pero no configuración crítica."
          >
            <select
              name="role"
              defaultValue="assistant"
              className="form-input"
            >
              <option value="assistant">Asistente</option>
              <option value="owner">Owner (acceso total)</option>
            </select>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" size={14} />}
              Crear usuario
            </Button>
          </DialogFooter>

          <style>{`
            .form-input {
              width: 100%;
              padding: 10px 12px;
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
