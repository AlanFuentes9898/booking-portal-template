"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[public error boundary]", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-[color:var(--color-brand-pink-soft)]/50 flex items-center justify-center text-[color:var(--color-brand-pink)]">
        <AlertTriangle size={26} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-semibold">
        Algo salió mal
      </h1>
      <p className="mt-3 text-[color:var(--color-brand-ink)]/70">
        Tuvimos un problema cargando esta página. Intenta de nuevo o vuelve al
        inicio.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs font-mono text-[color:var(--color-brand-muted)]">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button asChild variant="outline">
          <a href="/">Ir al inicio</a>
        </Button>
      </div>
    </section>
  );
}
