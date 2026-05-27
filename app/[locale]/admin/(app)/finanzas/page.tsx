import { redirect } from "next/navigation";
import { Wallet, AlertCircle, ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PaymentBadge, formatAmount } from "@/components/admin/payment-badge";
import { LockedFeatureCard } from "@/components/admin/locked-feature-card";
import { getSettings } from "@/lib/settings";
import { getPlan } from "@/lib/plan";
import { formatTz } from "@/lib/time";
import {
  defaultRange,
  getFinanceSummary,
  listOutstandingAppointments,
  presetRange,
  type FinancePreset,
  type FinanceRange,
} from "@/lib/finance-queries";
import { RevenueBarChart } from "./revenue-bar-chart";
import { MarkPaidButton } from "./mark-paid-button";

export const dynamic = "force-dynamic";

const PRESETS: { value: FinancePreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "7 días" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

type Props = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
  }>;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function FinanzasPage({ searchParams }: Props) {
  const plan = getPlan();
  if (!plan.allows("finance")) {
    return (
      <main className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto">
        <PageHeader
          title="Finanzas"
          description="Resumen de cobros, cuentas por cobrar y desglose por servicio y método."
        />
        <LockedFeatureCard feature="finance" currentTier={plan.tier} />
      </main>
    );
  }

  const settings = await getSettings();
  if (!settings.payments_enabled) {
    redirect("/admin/configuracion/pagos");
  }

  const sp = await searchParams;
  let range: FinanceRange;
  let activePreset: FinancePreset | null = null;
  if (
    sp.preset &&
    PRESETS.some((p) => p.value === sp.preset)
  ) {
    activePreset = sp.preset as FinancePreset;
    range = presetRange(activePreset);
  } else if (sp.from && sp.to && ISO_DATE.test(sp.from) && ISO_DATE.test(sp.to)) {
    range = { fromLocal: sp.from, toLocal: sp.to };
  } else {
    activePreset = "month";
    range = defaultRange();
  }

  const [summary, outstanding] = await Promise.all([
    getFinanceSummary(range),
    listOutstandingAppointments(50),
  ]);

  const currency = settings.currency_code;

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="Finanzas"
        description="Resumen de cobros, cuentas por cobrar y desglose por servicio y método."
      />

      {/* Range filter */}
      <form
        className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-4 mb-6 flex flex-wrap gap-3 items-end"
        action="/admin/finanzas"
      >
        <div className="flex gap-1 p-1 rounded-xl bg-[color:var(--color-brand-green-soft)]/30">
          {PRESETS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/finanzas?preset=${p.value}` as never}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activePreset === p.value
                  ? "bg-white shadow-sm text-[color:var(--color-brand-ink)]"
                  : "text-[color:var(--color-brand-ink)]/70 hover:text-[color:var(--color-brand-ink)]"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div className="flex-1" />
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1">
            Desde
          </span>
          <input
            type="date"
            name="from"
            defaultValue={range.fromLocal}
            className="px-3 py-2 rounded-xl border border-[color:var(--color-brand-ink)]/15 text-sm tabular-nums"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1">
            Hasta
          </span>
          <input
            type="date"
            name="to"
            defaultValue={range.toLocal}
            className="px-3 py-2 rounded-xl border border-[color:var(--color-brand-ink)]/15 text-sm tabular-nums"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] text-sm font-medium hover:brightness-95 transition"
        >
          Aplicar
        </button>
      </form>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          icon={<ArrowUpRight size={16} />}
          label="Total cobrado"
          value={formatAmount(summary.totalRevenue, currency)}
          tone="green"
        />
        <Kpi
          icon={<Wallet size={16} />}
          label="Citas pagadas"
          value={String(summary.paidCount)}
        />
        <Kpi
          icon={<ArrowDownRight size={16} />}
          label="Por cobrar"
          value={formatAmount(summary.outstandingAmount, currency)}
          help={`${summary.outstandingCount} citas`}
          tone="amber"
        />
        <Kpi
          icon={<Users size={16} />}
          label="Ticket promedio"
          value={formatAmount(summary.avgTicket, currency)}
        />
      </div>

      {/* Chart */}
      <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6 mb-6">
        <h2 className="text-base font-semibold mb-1">Ingresos por periodo</h2>
        <p className="text-xs text-[color:var(--color-brand-muted)] mb-4">
          Granularidad{" "}
          {summary.granularity === "day"
            ? "diaria"
            : summary.granularity === "week"
              ? "semanal"
              : "mensual"}
          .
        </p>
        {summary.byPeriod.length === 0 || summary.totalRevenue === 0 ? (
          <p className="text-sm text-[color:var(--color-brand-muted)] py-10 text-center">
            Sin ingresos registrados en este rango.
          </p>
        ) : (
          <RevenueBarChart
            data={summary.byPeriod}
            currency={currency}
          />
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BreakdownTable
          title="Por servicio"
          rows={summary.byService}
          currency={currency}
          emptyLabel="Aún sin pagos en este rango."
        />
        <BreakdownTable
          title="Por método de pago"
          rows={summary.byMethod}
          currency={currency}
          emptyLabel="Aún sin pagos en este rango."
        />
      </div>

      {/* Outstanding */}
      <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 overflow-hidden">
        <header className="flex items-center justify-between p-5 border-b border-[color:var(--color-brand-ink)]/8">
          <div>
            <h2 className="text-base font-semibold inline-flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" />
              Cuentas por cobrar
            </h2>
            <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
              Citas confirmadas o completadas que aún no están marcadas como
              pagadas. Marca como pagada con el monto sugerido del servicio o
              abre la cita para editar el detalle.
            </p>
          </div>
          <span className="text-xs text-[color:var(--color-brand-muted)] tabular-nums">
            {outstanding.length} citas · {formatAmount(
              outstanding.reduce((s, o) => s + (o.amount_due ?? 0), 0),
              currency,
            )}
          </span>
        </header>
        {outstanding.length === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--color-brand-muted)]">
            Sin cuentas por cobrar. ¡Todo al día!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] bg-[color:var(--color-brand-green-soft)]/20">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Servicio</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Monto</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[color:var(--color-brand-ink)]/5 hover:bg-[color:var(--color-brand-green-soft)]/10 transition"
                  >
                    <td className="px-4 py-3 whitespace-nowrap capitalize">
                      {formatTz(o.start_time, "EEE d MMM yyyy", "es")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.patient_name}</p>
                      <p className="text-xs text-[color:var(--color-brand-muted)] truncate max-w-[220px]">
                        {o.patient_email}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {o.type_name}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status="unpaid" />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {o.amount_due != null
                        ? formatAmount(o.amount_due, currency)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="inline-flex gap-3">
                        <MarkPaidButton
                          id={o.id}
                          amount={o.amount_due ?? 0}
                        />
                        <Link
                          href={`/admin/citas/${o.id}` as never}
                          className="text-[color:var(--color-brand-pink)] text-sm font-medium hover:underline"
                        >
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value,
  help,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  help?: string;
  tone?: "green" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "bg-[color:var(--color-brand-green-soft)]/40 text-[color:var(--color-brand-ink)]"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-[color:var(--color-brand-green-soft)]/30 text-[color:var(--color-brand-ink)]/80";
  return (
    <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`h-7 w-7 inline-flex items-center justify-center rounded-full ${toneClass}`}
        >
          {icon}
        </span>
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {help && (
        <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
          {help}
        </p>
      )}
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  currency,
  emptyLabel,
}: {
  title: string;
  rows: { name: string; count: number; total: number }[];
  currency: string;
  emptyLabel: string;
}) {
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5">
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--color-brand-muted)] py-6 text-center">
          {emptyLabel}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)]">
              <th className="pb-3 font-semibold">Nombre</th>
              <th className="pb-3 font-semibold text-right w-20">Citas</th>
              <th className="pb-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-brand-ink)]/5">
            {rows.map((r) => {
              const pct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
              return (
                <tr key={r.name}>
                  <td className="py-3">
                    <p className="font-medium">{r.name}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-[color:var(--color-brand-ink)]/5 overflow-hidden">
                      <div
                        className="h-full bg-[color:var(--color-brand-green)]"
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right tabular-nums">{r.count}</td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {formatAmount(r.total, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
