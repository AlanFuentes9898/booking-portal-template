import { Trash2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTz } from "@/lib/time";
import { deleteBlock } from "./actions";
import { BlockCreateForm } from "./block-create-form";

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
        <BlockCreateForm />
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
        .form-input[aria-invalid="true"] {
          border-color: var(--color-brand-pink);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-pink) 25%, transparent);
        }
      `}</style>
    </div>
  );
}

function sameDay(a: string, b: string): boolean {
  return (
    formatTz(a, "yyyy-MM-dd", "es") === formatTz(b, "yyyy-MM-dd", "es")
  );
}
