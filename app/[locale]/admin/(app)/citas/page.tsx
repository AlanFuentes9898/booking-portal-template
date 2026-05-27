import { Search, Video, MapPin, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { PaymentBadge, formatAmount } from "@/components/admin/payment-badge";
import { Button } from "@/components/ui/button";
import { listAppointments } from "@/lib/admin-queries";
import { getSettings } from "@/lib/settings";
import { getPlan } from "@/lib/plan";
import { formatTz } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    status?: string;
    modality?: string;
    payment_status?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function CitasListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status =
    sp.status === "confirmed" ||
    sp.status === "cancelled" ||
    sp.status === "completed" ||
    sp.status === "no_show"
      ? sp.status
      : "all";
  const modality =
    sp.modality === "in_person" || sp.modality === "virtual"
      ? sp.modality
      : "all";
  const paymentStatus =
    sp.payment_status === "unpaid" ||
    sp.payment_status === "paid" ||
    sp.payment_status === "refunded" ||
    sp.payment_status === "not_applicable"
      ? sp.payment_status
      : "all";

  const settings = await getSettings();
  const plan = getPlan();
  const paymentsActive = settings.payments_enabled && plan.allows("payments");
  const rows = await listAppointments({
    status: status as "all" | "confirmed" | "cancelled" | "completed" | "no_show",
    modality,
    payment_status: paymentStatus,
    search: sp.q,
    from: sp.from,
    to: sp.to,
  });

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="Citas"
        description="Todas las citas agendadas. Filtra por estado, modalidad o busca por paciente."
        actions={
          <Button asChild>
            <Link href="/admin/citas/nueva">
              <Plus size={16} /> Nueva cita
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <form
        className={`rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-4 mb-6 grid gap-3 items-end ${paymentsActive ? "sm:grid-cols-[1fr_auto_auto_auto_auto]" : "sm:grid-cols-[1fr_auto_auto_auto]"}`}
      >
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Buscar paciente
          </span>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
            />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="nombre, email o teléfono"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm"
            />
          </div>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Estado
          </span>
          <select
            name="status"
            defaultValue={status}
            className="px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
          >
            <option value="all">Todos</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No asistió</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
            Modalidad
          </span>
          <select
            name="modality"
            defaultValue={modality}
            className="px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
          >
            <option value="all">Todas</option>
            <option value="in_person">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>
        {paymentsActive && (
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
              Pago
            </span>
            <select
              name="payment_status"
              defaultValue={paymentStatus}
              className="px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
            >
              <option value="all">Todos</option>
              <option value="unpaid">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="refunded">Reembolsado</option>
              <option value="not_applicable">No aplica</option>
            </select>
          </label>
        )}
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] text-sm font-medium hover:brightness-95 transition"
        >
          Aplicar
        </button>
      </form>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--color-brand-muted)]">
            No hay citas que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] bg-[color:var(--color-brand-green-soft)]/20">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Hora</th>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Servicio</th>
                  <th className="px-4 py-3 font-semibold">Modalidad</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  {paymentsActive && (
                    <th className="px-4 py-3 font-semibold">Pago</th>
                  )}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-[color:var(--color-brand-ink)]/5 hover:bg-[color:var(--color-brand-green-soft)]/10 transition"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-[color:var(--color-brand-ink)] capitalize">
                      {formatTz(a.start_time, "EEE d MMM", "es")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums font-medium">
                      {formatTz(a.start_time, "HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {a.patient?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-[color:var(--color-brand-muted)] truncate max-w-[200px]">
                        {a.patient?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.appointment_type?.name_es}
                      <span className="text-[color:var(--color-brand-muted)]">
                        {" "}
                        · {a.appointment_type?.duration_minutes}m
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-ink)]/75">
                        {a.modality === "virtual" ? (
                          <Video size={12} />
                        ) : (
                          <MapPin size={12} />
                        )}
                        {a.modality === "virtual" ? "Virtual" : "Presencial"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    {paymentsActive && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <PaymentBadge status={a.payment_status} />
                          {a.payment_status === "paid" &&
                            a.amount_paid != null && (
                              <span className="text-xs text-[color:var(--color-brand-muted)] tabular-nums">
                                {formatAmount(
                                  a.amount_paid,
                                  settings.currency_code,
                                )}
                              </span>
                            )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/citas/${a.id}` as never}
                        className="text-[color:var(--color-brand-pink)] text-sm font-medium hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[color:var(--color-brand-muted)] text-right">
        Mostrando {rows.length} citas (máx 100).
      </p>
    </main>
  );
}
