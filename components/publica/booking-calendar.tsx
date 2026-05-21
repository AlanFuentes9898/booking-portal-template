"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es, enUS } from "date-fns/locale";
import { publicEnv } from "@/lib/env";

const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

const WEEKDAYS_ES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const WEEKDAYS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export type Slot = { start: string; end: string };

/**
 * Calendar grid (Mon-Sun) for a given month, in CLINIC_TZ.
 * Days with at least one slot show a green dot. Selected day shows filled circle.
 */
export function BookingCalendar({
  slots,
  selectedDay,
  onSelectDay,
  locale,
}: {
  slots: Slot[];
  /** ISO day key "YYYY-MM-DD" in CLINIC_TZ */
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  locale: "es" | "en";
}) {
  // Track which month we're viewing; default to first available day's month
  const firstAvailableDay = useMemo(() => {
    if (!slots[0]) return null;
    return formatInTimeZone(slots[0].start, CLINIC_TZ, "yyyy-MM-dd");
  }, [slots]);

  const [viewMonth, setViewMonth] = useState<string>(() => {
    // viewMonth keeps "YYYY-MM" (clinic-local)
    const source = firstAvailableDay ??
      formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
    return source.slice(0, 7);
  });

  const availableDays = useMemo(() => {
    const s = new Set<string>();
    for (const slot of slots) {
      s.add(formatInTimeZone(slot.start, CLINIC_TZ, "yyyy-MM-dd"));
    }
    return s;
  }, [slots]);

  // Build month grid: array of days (with leading blanks for ISO Mon=1 start)
  const grid = useMemo(() => {
    const [year, month] = viewMonth.split("-").map(Number) as [number, number];
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    // JS getUTCDay: 0=Sun..6=Sat. We want Mon=0..Sun=6.
    const jsDow = firstOfMonth.getUTCDay();
    const leading = (jsDow + 6) % 7;
    const cells: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, key });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const monthLabel = useMemo(() => {
    const [year, month] = viewMonth.split("-").map(Number) as [number, number];
    const d = new Date(Date.UTC(year, month - 1, 15));
    return formatInTimeZone(d, "UTC", locale === "es" ? "MMMM yyyy" : "MMMM yyyy", {
      locale: locale === "es" ? es : enUS,
    });
  }, [viewMonth, locale]);

  function shiftMonth(delta: number) {
    const [year, month] = viewMonth.split("-").map(Number) as [number, number];
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setViewMonth(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }

  const weekdays = locale === "es" ? WEEKDAYS_ES : WEEKDAYS_EN;

  return (
    <div className="rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/10 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-[color:var(--color-brand-green-soft)]/40 transition-colors"
          aria-label={locale === "es" ? "Mes anterior" : "Previous month"}
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-base sm:text-lg font-semibold capitalize">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-[color:var(--color-brand-green-soft)]/40 transition-colors"
          aria-label={locale === "es" ? "Mes siguiente" : "Next month"}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-semibold text-[color:var(--color-brand-muted)] tracking-wider">
        {weekdays.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {grid.map((cell, i) => {
          if (!cell) return <div key={`b${i}`} className="aspect-square" />;
          const available = availableDays.has(cell.key);
          const isSelected = selectedDay === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!available}
              onClick={() => onSelectDay(cell.key)}
              className={`aspect-square rounded-full text-sm sm:text-[15px] font-medium transition-all
                ${
                  isSelected
                    ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] shadow-md ring-2 ring-[color:var(--color-brand-ink)]/10"
                    : available
                      ? "bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)] hover:bg-[color:var(--color-brand-green-soft)]"
                      : "text-[color:var(--color-brand-ink)]/30 cursor-not-allowed"
                }`}
              aria-label={cell.key}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
