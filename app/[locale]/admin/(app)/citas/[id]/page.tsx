import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  Ban,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { getAppointmentById } from "@/lib/admin-queries";
import { formatTz } from "@/lib/time";
import { updateAppointmentStatus, updateAdminNotes } from "./actions";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CitaDetailPage({ params }: Props) {
  const { id } = await params;
  const appt = await getAppointmentById(id);
  if (!appt) notFound();

  const typeName = appt.appointment_type?.name_es ?? "Cita";
  const patientUrl = appt.patient
    ? `/admin/pacientes/${appt.patient.id}`
    : null;
  const publicCitaUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/cita/${appt.cancellation_token}`;

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto">
      <Link
        href="/admin/citas"
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] mb-4"
      >
        <ArrowLeft size={14} /> Volver a citas
      </Link>

      <PageHeader
        title={typeName}
        description={appt.patient?.full_name ?? undefined}
        actions={<StatusBadge status={appt.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        {/* MAIN COLUMN */}
        <div className="space-y-6">
          {/* Detail card */}
          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <h2 className="text-base font-semibold mb-5">Detalles</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <DetailRow
                icon={<CalendarDays size={15} />}
                label="Fecha"
                value={
                  <span className="capitalize">
                    {formatTz(
                      appt.start_time,
                      "EEEE d 'de' MMMM yyyy",
                      "es",
                    )}
                  </span>
                }
              />
              <DetailRow
                icon={<Clock size={15} />}
                label="Hora"
                value={`${formatTz(appt.start_time, "HH:mm")} – ${formatTz(appt.end_time, "HH:mm")} CDMX`}
              />
              <DetailRow
                icon={
                  appt.modality === "virtual" ? (
                    <Video size={15} />
                  ) : (
                    <MapPin size={15} />
                  )
                }
                label="Modalidad"
                value={
                  appt.modality === "virtual"
                    ? "Virtual (Google Meet)"
                    : "Presencial"
                }
              />
              <DetailRow
                icon={<CheckCircle2 size={15} />}
                label="Pago"
                value={
                  appt.payment_status === "paid"
                    ? `Pagado · $${appt.amount_paid?.toLocaleString("es-MX") ?? "?"}`
                    : appt.payment_status === "not_applicable"
                      ? "No aplica"
                      : "Pendiente"
                }
              />
            </div>

            {appt.meet_link && (
              <div className="mt-5 pt-5 border-t border-dashed border-[color:var(--color-brand-ink)]/10">
                <DetailRow
                  icon={<ExternalLink size={15} />}
                  label="Meet"
                  value={
                    <a
                      href={appt.meet_link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[color:var(--color-brand-pink)] underline break-all"
                    >
                      {appt.meet_link}
                    </a>
                  }
                />
              </div>
            )}
          </section>

          {/* Patient */}
          {appt.patient && (
            <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">Paciente</h2>
                {patientUrl && (
                  <Link
                    href={patientUrl as never}
                    className="text-sm text-[color:var(--color-brand-pink)] hover:underline"
                  >
                    Ver ficha completa →
                  </Link>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <DetailRow
                  icon={<Mail size={15} />}
                  label="Email"
                  value={
                    <a
                      href={`mailto:${appt.patient.email}`}
                      className="hover:underline break-all"
                    >
                      {appt.patient.email}
                    </a>
                  }
                />
                <DetailRow
                  icon={<Phone size={15} />}
                  label="Teléfono"
                  value={
                    <a
                      href={`https://wa.me/${appt.patient.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:underline"
                    >
                      {appt.patient.phone}
                    </a>
                  }
                />
                {appt.patient.sport && (
                  <DetailRow
                    icon={<CalendarDays size={15} />}
                    label="Deporte"
                    value={appt.patient.sport}
                  />
                )}
                {appt.patient.is_new && (
                  <DetailRow
                    icon={<AlertTriangle size={15} />}
                    label="Tipo"
                    value="Paciente nuevo (primera vez)"
                  />
                )}
              </div>
            </section>
          )}

          {/* Patient reason */}
          {appt.patient_reason && (
            <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
              <h2 className="text-base font-semibold mb-3">
                Comentario del paciente
              </h2>
              <p className="text-sm text-[color:var(--color-brand-ink)]/80 whitespace-pre-wrap">
                {appt.patient_reason}
              </p>
            </section>
          )}

          {/* Questionnaire */}
          {appt.questionnaire_response &&
            Object.keys(appt.questionnaire_response).length > 0 && (
              <QuestionnaireSection
                responses={
                  appt.questionnaire_response as Record<string, unknown>
                }
              />
            )}

          {/* Admin notes */}
          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <h2 className="text-base font-semibold mb-1">Notas privadas</h2>
            <p className="text-xs text-[color:var(--color-brand-muted)] mb-4">
              Solo visibles para el equipo. El paciente no las ve.
            </p>
            <form action={updateAdminNotes}>
              <input type="hidden" name="id" value={appt.id} />
              <textarea
                name="admin_notes"
                defaultValue={appt.admin_notes ?? ""}
                rows={5}
                className="w-full px-3.5 py-3 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm leading-relaxed"
                placeholder="Anota observaciones, plan, seguimiento…"
              />
              <div className="mt-3 flex justify-end">
                <Button type="submit" size="sm">
                  Guardar notas
                </Button>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN — actions */}
        <aside className="lg:sticky lg:top-6 space-y-4">
          <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5">
            <h3 className="text-sm font-semibold text-[color:var(--color-brand-ink)] mb-1">
              Acciones
            </h3>
            <p className="text-xs text-[color:var(--color-brand-muted)] mb-4">
              Cambia el estado de esta cita.
            </p>
            <div className="space-y-2">
              {appt.status === "confirmed" && (
                <>
                  <StatusButton
                    id={appt.id}
                    nextStatus="completed"
                    icon={<CheckCircle2 size={15} />}
                    label="Marcar como completada"
                    tone="green"
                  />
                  <StatusButton
                    id={appt.id}
                    nextStatus="no_show"
                    icon={<UserX size={15} />}
                    label="Marcar como no asistió"
                    tone="amber"
                  />
                  <StatusButton
                    id={appt.id}
                    nextStatus="cancelled"
                    icon={<Ban size={15} />}
                    label="Cancelar cita"
                    tone="pink"
                  />
                </>
              )}
              {appt.status !== "confirmed" && (
                <StatusButton
                  id={appt.id}
                  nextStatus="confirmed"
                  icon={<CheckCircle2 size={15} />}
                  label="Re-confirmar"
                  tone="green"
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5">
            <h3 className="text-sm font-semibold mb-3">Enlaces</h3>
            <a
              href={publicCitaUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 text-sm text-[color:var(--color-brand-pink)] hover:underline"
            >
              <ExternalLink size={14} /> Página pública del paciente
            </a>
            <a
              href={`/api/appointments/${appt.cancellation_token}/ics`}
              className="mt-2 flex items-center gap-2 text-sm text-[color:var(--color-brand-pink)] hover:underline"
            >
              <ExternalLink size={14} /> Descargar .ics
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-green-soft)]/50 text-[color:var(--color-brand-ink)]/80 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold">
          {label}
        </p>
        <p className="text-sm font-medium leading-snug mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatusButton({
  id,
  nextStatus,
  icon,
  label,
  tone,
}: {
  id: string;
  nextStatus: "confirmed" | "completed" | "cancelled" | "no_show";
  icon: React.ReactNode;
  label: string;
  tone: "green" | "pink" | "amber";
}) {
  const styles =
    tone === "green"
      ? "bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)] hover:bg-[color:var(--color-brand-green-soft)]"
      : tone === "pink"
        ? "bg-[color:var(--color-brand-pink-soft)]/30 text-[color:var(--color-brand-pink)] hover:bg-[color:var(--color-brand-pink-soft)]/50"
        : "bg-amber-50 text-amber-700 hover:bg-amber-100";
  return (
    <form action={updateAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${styles}`}
      >
        {icon} {label}
      </button>
    </form>
  );
}

function QuestionnaireSection({
  responses,
}: {
  responses: Record<string, unknown>;
}) {
  // Note: we don't have question text here without a join — for now display raw entries.
  // A future improvement: pass question_text lookup.
  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <h2 className="text-base font-semibold mb-3">Cuestionario previo</h2>
      <ul className="space-y-3 text-sm">
        {Object.entries(responses).map(([k, v]) => (
          <li key={k}>
            <p className="text-xs text-[color:var(--color-brand-muted)] font-mono break-all">
              {k}
            </p>
            <p className="text-[color:var(--color-brand-ink)]">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
