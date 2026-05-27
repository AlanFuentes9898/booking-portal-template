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
  Send,
  Wallet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { PaymentBadge, formatAmount } from "@/components/admin/payment-badge";
import { Button } from "@/components/ui/button";
import { getAppointmentById } from "@/lib/admin-queries";
import { getSettings } from "@/lib/settings";
import { getPlan } from "@/lib/plan";
import { formatTz } from "@/lib/time";
import {
  updateAppointmentStatus,
  updateAdminNotes,
  updateAppointmentPayment,
  updateAppointmentMeetLink,
  resendBookingEmail,
} from "./actions";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CitaDetailPage({ params }: Props) {
  const { id } = await params;
  const [appt, settings] = await Promise.all([
    getAppointmentById(id),
    getSettings(),
  ]);
  if (!appt) notFound();

  const plan = getPlan();
  const paymentsActive = settings.payments_enabled && plan.allows("payments");

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
                value={`${formatTz(appt.start_time, "HH:mm")} – ${formatTz(appt.end_time, "HH:mm")} ${settings.office_city}`}
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
                  appt.modality === "virtual" ? "Virtual" : "Presencial"
                }
              />
              {paymentsActive && (
                <DetailRow
                  icon={<Wallet size={15} />}
                  label="Pago"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <PaymentBadge status={appt.payment_status} />
                      {appt.payment_status === "paid" && (
                        <span className="text-[color:var(--color-brand-ink)]/80 text-sm">
                          {formatAmount(appt.amount_paid, settings.currency_code)}
                        </span>
                      )}
                    </span>
                  }
                />
              )}
            </div>
          </section>

          {/* Virtual session link */}
          {appt.modality === "virtual" && (
            <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
              <h2 className="text-base font-semibold mb-1">
                Enlace de la sesión
              </h2>
              <p className="text-xs text-[color:var(--color-brand-muted)] mb-4">
                Pega aquí el link que generes en Zoom, Google Meet, Jitsi u otro.
                El paciente lo verá en su correo de confirmación.
              </p>
              <form action={updateAppointmentMeetLink} className="space-y-3">
                <input type="hidden" name="id" value={appt.id} />
                <input
                  type="url"
                  name="meet_link"
                  defaultValue={appt.meet_link ?? ""}
                  placeholder="https://meet.example.com/abc-defg-hij"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="submit" size="sm" variant="outline">
                    Guardar link
                  </Button>
                </div>
              </form>
              {appt.meet_link && (
                <>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <ExternalLink
                      size={14}
                      className="text-[color:var(--color-brand-muted)]"
                    />
                    <a
                      href={appt.meet_link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[color:var(--color-brand-pink)] underline break-all"
                    >
                      {appt.meet_link}
                    </a>
                  </div>
                  <form action={resendBookingEmail} className="mt-4">
                    <input type="hidden" name="id" value={appt.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Send size={14} /> Reenviar correo con el link
                    </Button>
                  </form>
                </>
              )}
            </section>
          )}

          {/* Payment */}
          {paymentsActive && (
            <PaymentSection
              appointmentId={appt.id}
              paymentStatus={appt.payment_status}
              amountPaid={appt.amount_paid}
              paymentMethod={appt.payment_method}
              paidAt={appt.paid_at}
              suggestedAmount={appt.appointment_type?.price_mxn ?? null}
              methods={settings.payment_methods}
              currencyCode={settings.currency_code}
            />
          )}

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

function PaymentSection({
  appointmentId,
  paymentStatus,
  amountPaid,
  paymentMethod,
  paidAt,
  suggestedAmount,
  methods,
  currencyCode,
}: {
  appointmentId: string;
  paymentStatus: string;
  amountPaid: number | null;
  paymentMethod: string | null;
  paidAt: string | null;
  suggestedAmount: number | null;
  methods: string[];
  currencyCode: string;
}) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const paidDate = paidAt ? paidAt.slice(0, 10) : todayISO;
  const defaultAmount =
    amountPaid != null ? amountPaid : (suggestedAmount ?? "");
  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold">Pago</h2>
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            Registra si esta cita ya fue cobrada, el monto y el método.
          </p>
        </div>
        <PaymentBadge status={paymentStatus} />
      </div>
      <form
        action={updateAppointmentPayment}
        className="grid sm:grid-cols-2 gap-4"
      >
        <input type="hidden" name="id" value={appointmentId} />
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Estado
          </span>
          <select
            name="payment_status"
            defaultValue={paymentStatus}
            className="w-full px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
          >
            <option value="unpaid">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="refunded">Reembolsado</option>
            <option value="not_applicable">No aplica</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Monto ({currencyCode})
          </span>
          <input
            type="number"
            name="amount_paid"
            min={0}
            step="0.01"
            defaultValue={defaultAmount === "" ? "" : String(defaultAmount)}
            placeholder={
              suggestedAmount != null ? String(suggestedAmount) : "0.00"
            }
            className="w-full px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm tabular-nums"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Método
          </span>
          <select
            name="payment_method"
            defaultValue={paymentMethod ?? ""}
            className="w-full px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
          >
            <option value="">—</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Fecha de pago
          </span>
          <input
            type="date"
            name="paid_at"
            defaultValue={paidDate}
            className="w-full px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm tabular-nums"
          />
        </label>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" size="sm">
            Guardar pago
          </Button>
        </div>
      </form>
    </section>
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
