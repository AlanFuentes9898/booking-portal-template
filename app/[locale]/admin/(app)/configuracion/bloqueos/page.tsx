import { Trash2, Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { formatTz } from "@/lib/time";
import { createBlock, deleteBlock } from "./actions";

export const dynamic = "force-dynamic";

type BlockRow = {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

export default async function BloqueosPage() {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("blocked_periods")
    .select("id,start_time,end_time,reason")
    .gte("end_time", nowIso)
    .order("start_time", { ascending: true })
    .limit(100);

  const blocks = (data ?? []) as BlockRow[];

  return (
    <div className="space-y-6">
      {/* Create form */}
      <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
        <h2 className="text-base font-semibold mb-1">Nuevo bloqueo</h2>
        <p className="text-xs text-[color:var(--color-brand-muted)] mb-5">
          Bloquea fechas/horas para vacaciones, días feriados o ausencias.
          Las horas son en zona México.
        </p>
        <form action={createBlock} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <Field label="Inicio">
            <input
              type="datetime-local"
              name="start_local"
              required
              className="form-input"
            />
          </Field>
          <Field label="Fin">
            <input
              type="datetime-local"
              name="end_local"
              required
              className="form-input"
            />
          </Field>
          <Field label="Motivo (opcional)">
            <input
              type="text"
              name="reason"
              maxLength={200}
              placeholder="Vacaciones, congreso…"
              className="form-input"
            />
          </Field>
          <Button type="submit">
            <Plus size={15} /> Crear
          </Button>
        </form>
      </section>

      {/* List */}
      <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
        <h2 className="text-base font-semibold mb-4">Bloqueos vigentes</h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-[color:var(--color-brand-muted)] text-center py-6">
            Sin bloqueos próximos. Ningún horario está reservado.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--color-brand-ink)]/5">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    <span className="capitalize">
                      {formatTz(b.start_time, "EEE d MMM", "es")}
                    </span>{" "}
                    · {formatTz(b.start_time, "HH:mm")}
                    {" → "}
                    {sameDay(b.start_time, b.end_time) ? (
                      formatTz(b.end_time, "HH:mm")
                    ) : (
                      <>
                        <span className="capitalize">
                          {formatTz(b.end_time, "EEE d MMM", "es")}
                        </span>{" "}
                        · {formatTz(b.end_time, "HH:mm")}
                      </>
                    )}
                  </p>
                  {b.reason && (
                    <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
                      {b.reason}
                    </p>
                  )}
                </div>
                <form action={deleteBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-pink)] hover:bg-[color:var(--color-brand-pink-soft)]/30 transition"
                    aria-label="Eliminar bloqueo"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

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
    </div>
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
      <span className="block text-xs uppercase tracking-wider font-semibold text-[color:var(--color-brand-muted)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function sameDay(a: string, b: string): boolean {
  return (
    formatTz(a, "yyyy-MM-dd", "es") === formatTz(b, "yyyy-MM-dd", "es")
  );
}
