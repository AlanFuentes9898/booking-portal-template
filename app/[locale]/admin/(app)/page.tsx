import {
  CalendarDays,
  UserPlus,
  CheckCircle2,
  XCircle,
  Banknote,
  ArrowRight,
  Video,
  MapPin,
  Clock,
  Plus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireProfile } from "@/lib/auth";
import {
  getTodayAppointments,
  getUpcomingAppointments,
  getThisMonthStats,
  type AdminAppointmentRow,
} from "@/lib/admin-queries";
import { formatTz } from "@/lib/time";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const profile = await requireProfile();
  const [today, upcoming, stats, settings] = await Promise.all([
    getTodayAppointments(),
    getUpcomingAppointments(7),
    getThisMonthStats(),
    getSettings(),
  ]);

  const firstName = profile.full_name.split(" ")[0] ?? profile.full_name;
  const greeting = greetingFor(new Date());

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={summaryLine(today.length, upcoming.length)}
        actions={
          <>
            <Button asChild>
              <Link href="/admin/citas/nueva">
                <Plus size={16} /> Nueva cita
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/citas">
                Ver todas <ArrowRight size={16} />
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          icon={<UserPlus size={18} />}
          label="Pacientes nuevos (mes)"
          value={String(stats.newPatients)}
          accent="green"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Citas completadas"
          value={String(stats.completed)}
          accent="green"
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          label="Confirmadas pendientes"
          value={String(stats.confirmed)}
          accent="pink"
        />
        {settings.payments_enabled ? (
          <StatCard
            icon={<Banknote size={18} />}
            label="Ingresos del mes"
            value={`$${stats.incomeMxn.toLocaleString("es-MX")} MXN`}
            accent="pink"
          />
        ) : (
          <StatCard
            icon={<XCircle size={18} />}
            label="Canceladas (mes)"
            value={String(stats.cancelled)}
            accent="pink"
          />
        )}
      </section>

      {/* Today */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Hoy</h2>
          <span className="text-sm text-[color:var(--color-brand-muted)]">
            {today.length}{" "}
            {today.length === 1 ? "cita" : "citas"}
          </span>
        </div>
        {today.length === 0 ? (
          <EmptyState text="Sin citas agendadas para hoy." />
        ) : (
          <ul className="space-y-2">
            {today.map((a) => (
              <AppointmentRowItem key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Próximos 7 días</h2>
          <span className="text-sm text-[color:var(--color-brand-muted)]">
            {upcoming.length}{" "}
            {upcoming.length === 1 ? "cita" : "citas"}
          </span>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState text="Sin citas confirmadas en los próximos 7 días." />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((a) => (
              <AppointmentRowItem key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function greetingFor(d: Date): string {
  const h = Number(formatTz(d, "H"));
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function summaryLine(todayCount: number, upcomingCount: number): string {
  const parts: string[] = [];
  if (todayCount === 0) parts.push("Hoy no tienes citas");
  else parts.push(`Tienes ${todayCount} ${todayCount === 1 ? "cita" : "citas"} hoy`);
  parts.push(
    `${upcomingCount} ${upcomingCount === 1 ? "próxima" : "próximas"} esta semana`,
  );
  return parts.join(" · ");
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "green" | "pink";
}) {
  const iconBg =
    accent === "green"
      ? "bg-[color:var(--color-brand-green-soft)]/70 text-[color:var(--color-brand-ink)]"
      : "bg-[color:var(--color-brand-pink-soft)]/40 text-[color:var(--color-brand-pink)]";
  return (
    <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] mt-3 font-semibold">
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function AppointmentRowItem({ a }: { a: AdminAppointmentRow }) {
  const time = formatTz(a.start_time, "HH:mm");
  const day = formatTz(a.start_time, "EEE d MMM", "es");
  const typeName = a.appointment_type?.name_es ?? "Cita";
  const patient = a.patient?.full_name ?? "—";
  return (
    <li>
      <Link
        href={`/admin/citas/${a.id}` as never}
        className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-3 sm:p-4 hover:border-[color:var(--color-brand-green)] hover:shadow-sm transition-all"
      >
        <div className="hidden sm:flex flex-col items-center justify-center bg-[color:var(--color-brand-green-soft)]/40 rounded-xl px-3 py-2 min-w-[64px]">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-brand-muted)]">
            {day.split(" ")[0]}
          </span>
          <span className="text-base font-semibold leading-none">
            {day.split(" ")[1]}
          </span>
          <span className="text-[10px] text-[color:var(--color-brand-muted)] uppercase">
            {day.split(" ")[2]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{patient}</p>
          <p className="text-xs text-[color:var(--color-brand-muted)] truncate">
            {typeName} · {a.appointment_type?.duration_minutes ?? "?"} min
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 mr-1">
          <span className="text-sm font-semibold tabular-nums flex items-center gap-1.5">
            <Clock size={13} className="text-[color:var(--color-brand-muted)]" />
            {time}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] flex items-center gap-1">
            {a.modality === "virtual" ? (
              <Video size={12} />
            ) : (
              <MapPin size={12} />
            )}
            {a.modality === "virtual" ? "Virtual" : "Presencial"}
          </span>
        </div>
        <div className="sm:hidden text-right">
          <p className="text-sm font-semibold tabular-nums">{time}</p>
          <p className="text-[10px] uppercase text-[color:var(--color-brand-muted)]">
            {day}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </Link>
    </li>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-brand-ink)]/15 bg-white/50 p-8 text-center text-sm text-[color:var(--color-brand-muted)]">
      {text}
    </div>
  );
}
