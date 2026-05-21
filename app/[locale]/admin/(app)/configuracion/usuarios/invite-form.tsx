"use client";

import { useActionState, useEffect, useRef } from "react";
import { useState } from "react";
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
import { inviteUser, type InviteResult } from "./actions";

const initial: InviteResult = { ok: false, error: null };

export function InviteForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(inviteUser, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
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
          <Field label="Nombre completo">
            <input
              name="full_name"
              required
              maxLength={120}
              className="form-input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              className="form-input"
            />
          </Field>
          <Field label="Rol">
            <select
              name="role"
              defaultValue="assistant"
              className="form-input"
            >
              <option value="assistant">Asistente</option>
              <option value="owner">Owner (acceso total)</option>
            </select>
          </Field>

          {state.error && (
            <p className="text-sm text-[color:var(--color-brand-pink)] bg-[color:var(--color-brand-pink-soft)]/30 rounded-xl px-3 py-2.5">
              {state.error === "create_failed"
                ? "No se pudo crear el usuario. Verifica que el email no esté registrado."
                : state.error}
            </p>
          )}

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
