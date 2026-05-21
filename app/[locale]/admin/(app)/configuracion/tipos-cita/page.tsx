import { createAdminClient } from "@/lib/supabase/admin";
import { TypeForm, type AppointmentTypeRow } from "./type-form";

export const dynamic = "force-dynamic";

export default async function TiposCitaPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("appointment_types")
    .select("*")
    .order("sort_order", { ascending: true });

  const types = (data ?? []) as AppointmentTypeRow[];

  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold">Tipos de cita</h2>
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            Servicios que ofreces. Define duración, precio y si dispara el
            cuestionario para pacientes nuevos.
          </p>
        </div>
        <TypeForm triggerLabel="Nuevo tipo" />
      </header>

      {types.length === 0 ? (
        <p className="text-sm text-[color:var(--color-brand-muted)] text-center py-8">
          Aún no hay tipos de cita. Crea el primero.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                <th className="pb-3 font-semibold">Nombre</th>
                <th className="pb-3 font-semibold">Duración</th>
                <th className="pb-3 font-semibold">Precio</th>
                <th className="pb-3 font-semibold">Nuevos</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-brand-ink)]/5">
              {types.map((t) => (
                <tr key={t.id}>
                  <td className="py-3">
                    <p className="font-medium">{t.name_es}</p>
                    {t.name_en && (
                      <p className="text-xs text-[color:var(--color-brand-muted)]">
                        {t.name_en}
                      </p>
                    )}
                  </td>
                  <td className="py-3 tabular-nums">{t.duration_minutes} min</td>
                  <td className="py-3 tabular-nums">
                    {t.price_mxn != null
                      ? `$${t.price_mxn.toLocaleString("es-MX")}`
                      : "—"}
                  </td>
                  <td className="py-3">
                    {t.is_for_new_patients ? (
                      <span className="text-xs text-[color:var(--color-brand-pink)] font-medium">
                        Sí
                      </span>
                    ) : (
                      <span className="text-xs text-[color:var(--color-brand-muted)]">No</span>
                    )}
                  </td>
                  <td className="py-3">
                    {t.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-ink)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand-green)]" />
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs text-[color:var(--color-brand-muted)]">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <TypeForm type={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
