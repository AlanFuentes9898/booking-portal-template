import { Plus } from "lucide-react";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { CLINIC_TZ } from "@/lib/time";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { listAppointments } from "@/lib/admin-queries";
import { CalendarView } from "./calendar-view";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ view?: "week" | "month"; date?: string }>;
};

export default async function CalendarioPage({ searchParams }: Props) {
  const sp = await searchParams;
  const view: "week" | "month" = sp.view === "month" ? "month" : "week";
  const anchorDayLocal =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)
      ? sp.date
      : formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");

  const { fromUtc, toUtc } = computeRangeUtc(anchorDayLocal, view);

  const appointments = await listAppointments({
    from: fromUtc.toISOString(),
    to: toUtc.toISOString(),
    status: "all",
    limit: 500,
  });

  // Pass only the fields the client component needs
  const events = appointments
    .filter((a) => a.status !== "cancelled")
    .map((a) => ({
      id: a.id,
      startIso: a.start_time,
      endIso: a.end_time,
      title: a.patient?.full_name ?? "Cita",
      typeName: a.appointment_type?.name_es ?? "",
      modality: a.modality,
      status: a.status,
    }));

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="Calendario"
        description="Vista visual de tus citas. Click en una cita para abrir su detalle."
        actions={
          <Button asChild>
            <Link href="/admin/citas/nueva">
              <Plus size={16} /> Nueva cita
            </Link>
          </Button>
        }
      />
      <CalendarView
        view={view}
        anchorDayLocal={anchorDayLocal}
        events={events}
      />
    </main>
  );
}

function computeRangeUtc(
  anchorDayLocal: string,
  view: "week" | "month",
): { fromUtc: Date; toUtc: Date } {
  const [y, m, d] = anchorDayLocal.split("-").map(Number) as [number, number, number];
  if (view === "month") {
    const monthStart = `${y}-${String(m).padStart(2, "0")}-01T00:00:00`;
    const nextMonthDate = new Date(Date.UTC(y, m, 1));
    const nextLocal = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00`;
    return {
      fromUtc: fromZonedTime(monthStart, CLINIC_TZ),
      toUtc: fromZonedTime(nextLocal, CLINIC_TZ),
    };
  }
  // Week: find Monday of anchor
  const anchorUtc = new Date(Date.UTC(y, m - 1, d));
  const jsDow = anchorUtc.getUTCDay(); // 0=Sun..6=Sat
  const offsetToMonday = (jsDow + 6) % 7;
  const mondayUtc = new Date(anchorUtc.getTime() - offsetToMonday * 86400_000);
  const mondayLocal = `${mondayUtc.getUTCFullYear()}-${String(mondayUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(mondayUtc.getUTCDate()).padStart(2, "0")}T00:00:00`;
  const sundayPlus = new Date(mondayUtc.getTime() + 7 * 86400_000);
  const sundayLocal = `${sundayPlus.getUTCFullYear()}-${String(sundayPlus.getUTCMonth() + 1).padStart(2, "0")}-${String(sundayPlus.getUTCDate()).padStart(2, "0")}T00:00:00`;
  return {
    fromUtc: fromZonedTime(mondayLocal, CLINIC_TZ),
    toUtc: fromZonedTime(sundayLocal, CLINIC_TZ),
  };
}
