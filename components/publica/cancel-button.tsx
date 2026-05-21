"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const COPY = {
  es: {
    trigger: "Cancelar cita",
    title: "¿Cancelar tu cita?",
    body: "Si cancelas, el horario quedará libre para alguien más. Te enviaremos un correo de confirmación. Esta acción no se puede deshacer.",
    confirm: "Sí, cancelar",
    keep: "Mantener cita",
    cancelling: "Cancelando…",
    errorTooLate: "Ya pasó el límite para cancelar online.",
    errorGeneric: "No se pudo cancelar. Intenta de nuevo.",
  },
  en: {
    trigger: "Cancel booking",
    title: "Cancel your appointment?",
    body: "If you cancel, this slot becomes available for someone else. We'll send a confirmation email. This action can't be undone.",
    confirm: "Yes, cancel",
    keep: "Keep appointment",
    cancelling: "Cancelling…",
    errorTooLate: "Online cancellation deadline has passed.",
    errorGeneric: "Couldn't cancel. Try again.",
  },
};

export function CancelButton({
  token,
  locale,
}: {
  token: string;
  locale: "es" | "en";
}) {
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function cancel() {
    setSubmitting(true);
    setError(null);
    const r = await fetch(`/api/appointments/${token}/cancel`, {
      method: "POST",
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error === "too_late" ? t.errorTooLate : t.errorGeneric);
      setSubmitting(false);
      return;
    }
    setOpen(false);
    setSubmitting(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="outline">{t.trigger}</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-pink-soft)]/50 text-[color:var(--color-brand-pink)]">
            <AlertTriangle size={20} />
          </div>
          <DialogHeader className="flex-1">
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription>{t.body}</DialogDescription>
          </DialogHeader>
        </div>

        {error && (
          <p className="text-sm text-[color:var(--color-brand-pink)] -mt-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={submitting}>
              {t.keep}
            </Button>
          </DialogClose>
          <Button
            variant="accent"
            onClick={cancel}
            disabled={submitting || isPending}
          >
            {(submitting || isPending) && (
              <Loader2 className="animate-spin" size={14} />
            )}
            {submitting ? t.cancelling : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
