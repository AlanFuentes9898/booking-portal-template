import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Activity,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { getPatient } from "@/lib/admin-queries";
import { formatTz } from "@/lib/time";
import { updatePatientNotes } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const p = await getPatient(id);
  if (!p) notFound();

  const initial = p.full_name.charAt(0).toUpperCase();
  const totalAppts = p.history.length;
  const completed = p.history.filter((h) => h.status === "completed").length;

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto">
      <Link
        href="/admin/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] mb-4"
      >
        <ArrowLeft size={14} /> Volver a pacientes
      </Link>

      <PageHeader
        title={p.full_name}
        description={`Paciente desde ${formatTz(p.created_at, "d 'de' MMMM yyyy", "es")}`}
        actions={
          <Button asChild>
            <Link href={`/admin/citas/nueva?patient_id=${p.id}` as never}>
              <Plus size={16} /> Agendar cita
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        {/* MAIN */}
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <div className="flex items-start gap-4">
              <span className="h-14 w-14 rounded-full bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] font-semibold text-xl flex items-center justify-center flex-shrink-0">
                {initial}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{p.full_name}</h2>
                <div className="mt-2 flex flex-col gap-1.5 text-sm">
                  <a
                    href={`mailto:${p.email}`}
                    className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80 hover:text-[color:var(--color-brand-pink)]"
                  >
                    <Mail size={14} /> {p.email}
                  </a>
                  <a
                    href={`https://wa.me/${p.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80 hover:text-[color:var(--color-brand-pink)]"
                  >
                    <Phone size={14} /> {p.phone}
                  </a>
                  {p.sport && (
                    <span className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80">
                      <Activity size={14} /> {p.sport}
                    </span>
                  )}
                  {p.birthdate && (
                    <span className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80">
                      <CalendarDays size={14} />{" "}
                      {formatTz(p.birthdate, "d MMMM yyyy", "es")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* History */}
          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Historial de citas</h2>
              <span className="text-sm text-[color:var(--color-brand-muted)]">
                {totalAppts} {totalAppts === 1 ? "cita" : "citas"} · {completed}{" "}
                completadas
              </span>
            </div>
            {p.history.length === 0 ? (
              <p className="text-sm text-[color:var(--color-brand-muted)] text-center py-6">
                Aún no tiene citas registradas.
              </p>
            ) : (
              <ul className="divide-y divide-[color:var(--color-brand-ink)]/5">
                {p.history.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/admin/citas/${h.id}` as never}
                      className="flex items-center gap-4 py-3 hover:bg-[color:var(--color-brand-green-soft)]/10 -mx-2 px-2 rounded-lg transition"
                    >
                      <div className="flex flex-col items-center bg-[color:var(--color-brand-green-soft)]/30 rounded-lg px-3 py-1.5 min-w-[60px]">
                        <span className="text-[10px] uppercase text-[color:var(--color-brand-muted)]">
                          {formatTz(h.start_time, "MMM", "es")}
                        </span>
                        <span className="text-lg font-semibold leading-none">
                          {formatTz(h.start_time, "d")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {h.appointment_type?.name_es ?? "Cita"}
                        </p>
                        <p className="text-xs text-[color:var(--color-brand-muted)]">
                          {formatTz(h.start_time, "HH:mm")} ·{" "}
                          {h.modality === "virtual" ? "Virtual" : "Presencial"}
                        </p>
                      </div>
                      <StatusBadge status={h.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notes */}
          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <h2 className="text-base font-semibold mb-1">Notas privadas</h2>
            <p className="text-xs text-[color:var(--color-brand-muted)] mb-4">
              Historia clínica, observaciones, plan a largo plazo. El paciente
              no las ve.
            </p>
            <form action={updatePatientNotes}>
              <input type="hidden" name="id" value={p.id} />
              <textarea
                name="admin_notes"
                defaultValue={p.admin_notes ?? ""}
                rows={8}
                className="w-full px-3.5 py-3 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm leading-relaxed"
                placeholder="Historial, plan nutricional, alergias, seguimiento..."
              />
              <div className="mt-3 flex justify-end">
                <Button type="submit" size="sm">
                  Guardar notas
                </Button>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="lg:sticky lg:top-6 space-y-4">
          <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5">
            <h3 className="text-sm font-semibold mb-4">Resumen</h3>
            <dl className="space-y-3 text-sm">
              <Stat label="Total citas" value={String(totalAppts)} />
              <Stat label="Completadas" value={String(completed)} />
              <Stat
                label="Estado"
                value={p.is_new ? "Paciente nuevo" : "Paciente recurrente"}
              />
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[color:var(--color-brand-muted)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
