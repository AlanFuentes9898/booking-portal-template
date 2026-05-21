"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="rounded-3xl bg-white border border-[color:var(--color-brand-pink)]/30 p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[color:var(--color-brand-pink-soft)]/50 flex items-center justify-center text-[color:var(--color-brand-pink)]">
          <AlertTriangle size={22} />
        </div>
        <h2 className="text-xl font-semibold">Error en el panel</h2>
        <p className="mt-2 text-sm text-[color:var(--color-brand-muted)]">
          Algo falló al cargar esta sección.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs font-mono text-[color:var(--color-brand-muted)]">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button asChild variant="outline">
            <a href="/admin">Volver al dashboard</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
