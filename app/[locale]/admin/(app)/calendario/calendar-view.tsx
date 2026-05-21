"use client";

import { useMemo } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Video, MapPin } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { publicEnv } from "@/lib/env";

const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

export type CalendarEvent = {
  id: string;
  startIso: string;
  endIso: string;
  title: string;
  typeName: string;
  modality: "in_person" | "virtual";
  status: "confirmed" | "completed" | "no_show" | "cancelled";
};

export function CalendarView({
  view,
  anchorDayLocal,
  events,
}: {
  view: "week" | "month";
  anchorDayLocal: string;
  events: CalendarEvent[];
}) {
  const router = useRouter();

  // anchorDayLocal is YYYY-MM-DD (clinic-local).
  const headerLabel = useMemo(() => {
    if (view === "month") {
      const [y, m] = anchorDayLocal.split("-").map(Number) as [number, number];
      const d = new Date(Date.UTC(y, m - 1, 15));
      const label = formatInTimeZone(d, "UTC", "MMMM yyyy", { locale: es });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    // Week: show "MMM d – MMM d, yyyy"
    const monday = mondayOf(anchorDayLocal);
    const sunday = addDaysLocal(monday, 6);
    const same = monday.slice(0, 7) === sunday.slice(0, 7);
    if (same) {
      const dayMonth = formatInTimeZone(
        new Date(Date.UTC(...parseLocal(monday))),
        "UTC",
        "d",
      );
      const dayMonth2 = formatInTimeZone(
        new Date(Date.UTC(...parseLocal(sunday))),
        "UTC",
        "d 'de' MMMM yyyy",
        { locale: es },
      );
      return `${dayMonth}–${dayMonth2}`;
    }
    return `${formatInTimeZone(
      new Date(Date.UTC(...parseLocal(monday))),
      "UTC",
      "d 'de' MMM",
      { locale: es },
    )} – ${formatInTimeZone(
      new Date(Date.UTC(...parseLocal(sunday))),
      "UTC",
      "d 'de' MMM yyyy",
      { locale: es },
    )}`;
  }, [view, anchorDayLocal]);

  function shift(delta: number) {
    let nextAnchor: string;
    if (view === "month") {
      const [y, m] = anchorDayLocal.split("-").map(Number) as [number, number];
      const next = new Date(Date.UTC(y, m - 1 + delta, 1));
      nextAnchor = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
    } else {
      nextAnchor = addDaysLocal(anchorDayLocal, 7 * delta);
    }
    router.push(
      `/admin/calendario?view=${view}&date=${nextAnchor}` as never,
    );
  }

  function setView(v: "week" | "month") {
    router.push(
      `/admin/calendario?view=${v}&date=${anchorDayLocal}` as never,
    );
  }

  function goToday() {
    const today = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
    router.push(`/admin/calendario?view=${view}&date=${today}` as never);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="h-9 w-9 rounded-lg inline-flex items-center justify-center border border-[color:var(--color-brand-ink)]/10 bg-white hover:bg-[color:var(--color-brand-green-soft)]/30"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="h-9 w-9 rounded-lg inline-flex items-center justify-center border border-[color:var(--color-brand-ink)]/10 bg-white hover:bg-[color:var(--color-brand-green-soft)]/30"
            aria-label="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="h-9 px-3 rounded-lg text-sm font-medium border border-[color:var(--color-brand-ink)]/10 bg-white hover:bg-[color:var(--color-brand-green-soft)]/30"
          >
            Hoy
          </button>
          <h2 className="ml-2 text-lg font-semibold capitalize">
            {headerLabel}
          </h2>
        </div>
        <div className="inline-flex p-1 rounded-xl border border-[color:var(--color-brand-ink)]/10 bg-white">
          <button
            type="button"
            onClick={() => setView("week")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              view === "week"
                ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)]"
                : "text-[color:var(--color-brand-muted)]"
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              view === "month"
                ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)]"
                : "text-[color:var(--color-brand-muted)]"
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {view === "week" ? (
        <WeekGrid anchorDayLocal={anchorDayLocal} events={events} />
      ) : (
        <MonthGrid anchorDayLocal={anchorDayLocal} events={events} />
      )}
    </div>
  );
}

/* ============ WEEK VIEW ============ */
function WeekGrid({
  anchorDayLocal,
  events,
}: {
  anchorDayLocal: string;
  events: CalendarEvent[];
}) {
  const monday = mondayOf(anchorDayLocal);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysLocal(monday, i)),
    [monday],
  );

  // Group events by clinic-local day
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = formatInTimeZone(e.startIso, CLINIC_TZ, "yyyy-MM-dd");
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  const todayLocal = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");

  return (
    <div className="rounded-2xl border border-[color:var(--color-brand-ink)]/8 bg-white overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[color:var(--color-brand-ink)]/8">
        {days.map((d) => {
          const isToday = d === todayLocal;
          const dayDate = new Date(Date.UTC(...parseLocal(d)));
          return (
            <div
              key={d}
              className={`p-3 text-center border-r last:border-r-0 border-[color:var(--color-brand-ink)]/8 ${
                isToday ? "bg-[color:var(--color-brand-green-soft)]/40" : ""
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold">
                {formatInTimeZone(dayDate, "UTC", "EEE", { locale: es })}
              </p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  isToday ? "text-[color:var(--color-brand-pink)]" : ""
                }`}
              >
                {formatInTimeZone(dayDate, "UTC", "d")}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[420px]">
        {days.map((d) => {
          const dayEvents = (byDay.get(d) ?? []).sort((a, b) =>
            a.startIso.localeCompare(b.startIso),
          );
          return (
            <div
              key={d}
              className="border-r last:border-r-0 border-[color:var(--color-brand-ink)]/8 p-2 space-y-1.5"
            >
              {dayEvents.length === 0 ? (
                <div className="text-[10px] text-[color:var(--color-brand-muted)]/60 text-center mt-4">
                  —
                </div>
              ) : (
                dayEvents.map((e) => <EventChip key={e.id} e={e} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ MONTH VIEW ============ */
function MonthGrid({
  anchorDayLocal,
  events,
}: {
  anchorDayLocal: string;
  events: CalendarEvent[];
}) {
  const cells = useMemo(() => {
    const [year, month] = anchorDayLocal.split("-").map(Number) as [number, number];
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const jsDow = firstOfMonth.getUTCDay();
    const leading = (jsDow + 6) % 7;
    const out: ({ key: string; day: number } | null)[] = [];
    for (let i = 0; i < leading; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ key, day: d });
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [anchorDayLocal]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = formatInTimeZone(e.startIso, CLINIC_TZ, "yyyy-MM-dd");
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  const todayLocal = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
  const weekdays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  return (
    <div className="rounded-2xl border border-[color:var(--color-brand-ink)]/8 bg-white overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[color:var(--color-brand-ink)]/8 bg-[color:var(--color-brand-green-soft)]/20">
        {weekdays.map((w) => (
          <div
            key={w}
            className="p-2 text-center text-[10px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell)
            return (
              <div
                key={`b${i}`}
                className="aspect-square border-r border-b border-[color:var(--color-brand-ink)]/8 bg-[color:var(--color-brand-ink)]/[0.015]"
              />
            );
          const dayEvents = (byDay.get(cell.key) ?? []).sort((a, b) =>
            a.startIso.localeCompare(b.startIso),
          );
          const isToday = cell.key === todayLocal;
          return (
            <div
              key={cell.key}
              className={`min-h-[110px] p-1.5 border-r border-b border-[color:var(--color-brand-ink)]/8 ${
                isToday ? "bg-[color:var(--color-brand-green-soft)]/30" : ""
              }`}
            >
              <p
                className={`text-xs font-semibold mb-1 ${
                  isToday
                    ? "text-[color:var(--color-brand-pink)]"
                    : "text-[color:var(--color-brand-ink)]/60"
                }`}
              >
                {cell.day}
              </p>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} e={e} compact />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-[color:var(--color-brand-muted)] px-1">
                    + {dayEvents.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ EVENT CHIP ============ */
function EventChip({
  e,
  compact,
}: {
  e: CalendarEvent;
  compact?: boolean;
}) {
  const time = formatInTimeZone(e.startIso, CLINIC_TZ, "HH:mm");
  const tone =
    e.status === "completed"
      ? "bg-[color:var(--color-brand-ink)]/5 text-[color:var(--color-brand-ink)]/70 border-[color:var(--color-brand-ink)]/10"
      : e.status === "no_show"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-[color:var(--color-brand-green-soft)]/70 text-[color:var(--color-brand-ink)] border-[color:var(--color-brand-green)]/30 hover:bg-[color:var(--color-brand-green-soft)]";

  return (
    <Link
      href={`/admin/citas/${e.id}` as never}
      className={`block rounded-md border px-1.5 py-1 text-[11px] leading-tight ${tone} transition`}
      title={`${time} · ${e.title} · ${e.typeName}`}
    >
      <span className="flex items-center gap-1 font-semibold tabular-nums">
        {time}
        {e.modality === "virtual" ? (
          <Video size={9} className="opacity-60" />
        ) : (
          <MapPin size={9} className="opacity-60" />
        )}
      </span>
      <span className="block truncate">{e.title}</span>
      {!compact && (
        <span className="block truncate opacity-70 text-[10px]">
          {e.typeName}
        </span>
      )}
    </Link>
  );
}

/* ============ helpers ============ */
function mondayOf(dayLocal: string): string {
  const [y, m, d] = dayLocal.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const jsDow = date.getUTCDay();
  const offsetToMonday = (jsDow + 6) % 7;
  const monday = new Date(date.getTime() - offsetToMonday * 86400_000);
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
}

function addDaysLocal(dayLocal: string, delta: number): string {
  const [y, m, d] = dayLocal.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const next = new Date(date.getTime() + delta * 86400_000);
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function parseLocal(dayLocal: string): [number, number, number] {
  const [y, m, d] = dayLocal.split("-").map(Number) as [number, number, number];
  return [y, m - 1, d];
}
