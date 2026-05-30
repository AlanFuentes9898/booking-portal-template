/**
 * Slot computation engine. **Pure function** — no DB access, no clock.
 *
 * Caller responsibilities (e.g. /api/availability):
 *   1. Load DB inputs (working_hours, blocked_periods, existing appointments, settings)
 *   2. Pass `now` explicitly (testable)
 *   3. Convert result Date objects to ISO strings at the network boundary
 *
 * Time model:
 *   - All inputs and outputs use absolute UTC Date objects (or UTC ISO strings)
 *   - "Day of week" and "time of day" come from working_hours which are wall-clock in CLINIC_TZ
 *   - We materialize working windows by combining a calendar day in CLINIC_TZ with the local time,
 *     then converting that wall-clock instant back to UTC.
 *
 * Buffer model:
 *   - `buffer_minutes` is enforced between any two adjacent appointments (existing or proposed).
 *   - A proposed slot at [s, e) collides with an existing appointment [s', e') if their padded
 *     intervals overlap: [s - buffer, e + buffer) ∩ [s' - buffer, e' + buffer) ≠ ∅.
 *     Equivalently: s < e' + buffer AND s' < e + buffer.
 *   - blocked_periods use a hard boundary (no buffer padding) — they represent absolute blocks.
 */

import { fromZonedTime, toZonedTime, format as formatTz } from "date-fns-tz";
import { publicEnv } from "@/lib/env";

/** Active timezone for slot computation. Configurable via NEXT_PUBLIC_TIMEZONE. */
export const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

export type WorkingHoursRow = {
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string; // "HH:MM" or "HH:MM:SS" in CLINIC_TZ wall clock
  end_time: string;
  is_active: boolean;
};

export type BlockedPeriod = {
  start_time: Date; // UTC instant
  end_time: Date; // UTC instant
};

export type ExistingAppointment = {
  start_time: Date;
  end_time: Date;
};

export type AvailabilityConfig = {
  durationMinutes: number;
  bufferMinutes: number;
  minBookingHoursAhead: number;
  maxBookingDaysAhead: number;
};

export type AvailabilityInput = {
  /** Window start (UTC). Slot computation is bounded by this. */
  dateFrom: Date;
  /** Window end (UTC), exclusive. */
  dateTo: Date;
  /** Current time (UTC) — pass `new Date()` in production, fixed in tests. */
  now: Date;
  config: AvailabilityConfig;
  workingHours: WorkingHoursRow[];
  blockedPeriods: BlockedPeriod[];
  existingAppointments: ExistingAppointment[];
};

export type Slot = {
  /** UTC instant when the slot starts */
  start: Date;
  /** UTC instant when the slot ends (start + durationMinutes) */
  end: Date;
};

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/**
 * Slot starts are snapped to this granularity (in minutes). With 30, slots are
 * always offered at :00 and :30 wall-clock — so a 45-min appointment at 16:30
 * is followed by 17:30 (not 17:15), regardless of duration+buffer arithmetic.
 *
 * NOTE: this is rounded in UTC epoch ms. That coincides with wall-clock rounding
 * only when the clinic timezone has UTC-offset that is itself a multiple of 30min
 * AND has no DST jumps inside the window. Both hold for America/Mexico_City
 * (UTC-6, no DST since 2022). If we ever onboard a DST clinic, this needs to
 * round in CLINIC_TZ wall-clock space instead.
 */
const SLOT_GRANULARITY_MIN = 30;

function ceilToGranularityUtc(ms: number, granMin: number): number {
  const granMs = granMin * MS_PER_MIN;
  return Math.ceil(ms / granMs) * granMs;
}

/** Parse "HH:MM" or "HH:MM:SS" — returns [hours, minutes]. */
function parseClockTime(s: string): [number, number] {
  const [h, m] = s.split(":");
  return [Number(h), Number(m)];
}

/** Get day-of-week (0–6) for an instant interpreted in CLINIC_TZ. */
function dowInClinicTz(utc: Date): number {
  // toZonedTime returns a Date whose UTC fields reflect the wall-clock in tz.
  // .getUTCDay() on that yields the local day-of-week.
  return toZonedTime(utc, CLINIC_TZ).getUTCDay();
}

/** Build an absolute UTC instant for "YYYY-MM-DD HH:MM" in CLINIC_TZ. */
function clinicWallClockToUtc(
  zonedDay: Date, // Date whose UTC fields encode the local calendar day in tz
  hours: number,
  minutes: number,
): Date {
  const y = zonedDay.getUTCFullYear();
  const m = String(zonedDay.getUTCMonth() + 1).padStart(2, "0");
  const d = String(zonedDay.getUTCDate()).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  // fromZonedTime treats this naive string as wall-clock in CLINIC_TZ.
  return fromZonedTime(`${y}-${m}-${d}T${hh}:${mm}:00`, CLINIC_TZ);
}

/**
 * Iterate clinic-local calendar days that intersect [dateFrom, dateTo).
 * Yields Date objects whose UTC fields encode the local day at 00:00 in CLINIC_TZ.
 */
function* iterateClinicDays(dateFrom: Date, dateTo: Date): Generator<Date> {
  // Anchor each candidate day at noon UTC of dateFrom's clinic day to avoid DST edge slips
  let cursorZoned = toZonedTime(dateFrom, CLINIC_TZ);
  cursorZoned.setUTCHours(0, 0, 0, 0);
  while (true) {
    // Convert clinic-day 00:00 → UTC instant
    const dayStartUtc = clinicWallClockToUtc(cursorZoned, 0, 0);
    if (dayStartUtc.getTime() >= dateTo.getTime()) return;
    // Yield even if the day starts before dateFrom — caller filters per-slot
    yield cursorZoned;
    cursorZoned = new Date(cursorZoned.getTime() + MS_PER_DAY);
    cursorZoned = toZonedTime(
      clinicWallClockToUtc(cursorZoned, 0, 0),
      CLINIC_TZ,
    );
  }
}

/**
 * If the slot collides with one or more blocked periods, returns the latest
 * `end_time` among the colliders (epoch ms) so the caller can fast-forward.
 * Returns `null` if no collision.
 */
function blockedCollisionEnd(
  slot: Slot,
  blocked: BlockedPeriod[],
): number | null {
  let maxEnd: number | null = null;
  for (const b of blocked) {
    if (slot.start < b.end_time && b.start_time < slot.end) {
      const e = b.end_time.getTime();
      if (maxEnd === null || e > maxEnd) maxEnd = e;
    }
  }
  return maxEnd;
}

/**
 * If the slot collides (buffered) with one or more existing appointments,
 * returns the latest `end_time + buffer` so the caller can fast-forward past
 * the busy region. Returns `null` if no collision.
 */
function existingCollisionEnd(
  slot: Slot,
  existing: ExistingAppointment[],
  bufferMinutes: number,
): number | null {
  const bufferMs = bufferMinutes * MS_PER_MIN;
  let maxEnd: number | null = null;
  for (const a of existing) {
    const aStart = a.start_time.getTime();
    const aEnd = a.end_time.getTime();
    const sStart = slot.start.getTime();
    const sEnd = slot.end.getTime();
    if (sStart < aEnd + bufferMs && aStart < sEnd + bufferMs) {
      const e = aEnd + bufferMs;
      if (maxEnd === null || e > maxEnd) maxEnd = e;
    }
  }
  return maxEnd;
}

export function computeAvailableSlots(input: AvailabilityInput): Slot[] {
  const {
    dateFrom,
    dateTo,
    now,
    config,
    workingHours,
    blockedPeriods,
    existingAppointments,
  } = input;

  const { durationMinutes, bufferMinutes } = config;
  const durationMs = durationMinutes * MS_PER_MIN;
  // Smallest forward step when a slot is accepted or harmlessly skipped.
  const granStepMs = SLOT_GRANULARITY_MIN * MS_PER_MIN;

  const minBookingInstant = new Date(
    now.getTime() + config.minBookingHoursAhead * MS_PER_HOUR,
  );
  const maxBookingInstant = new Date(
    now.getTime() + config.maxBookingDaysAhead * MS_PER_DAY,
  );

  // Effective window: respect dateFrom/dateTo AND min/max booking limits
  const effectiveFrom = new Date(
    Math.max(dateFrom.getTime(), minBookingInstant.getTime()),
  );
  const effectiveTo = new Date(
    Math.min(dateTo.getTime(), maxBookingInstant.getTime()),
  );

  if (effectiveFrom >= effectiveTo) return [];

  const slots: Slot[] = [];
  const activeWindows = workingHours.filter((w) => w.is_active);

  for (const zonedDay of iterateClinicDays(effectiveFrom, effectiveTo)) {
    const dow = zonedDay.getUTCDay();
    const dayWindows = activeWindows.filter((w) => w.day_of_week === dow);
    if (dayWindows.length === 0) continue;

    for (const win of dayWindows) {
      const [sh, sm] = parseClockTime(win.start_time);
      const [eh, em] = parseClockTime(win.end_time);
      const winStart = clinicWallClockToUtc(zonedDay, sh, sm);
      const winEnd = clinicWallClockToUtc(zonedDay, eh, em);

      // Slot starts are snapped to SLOT_GRANULARITY_MIN (e.g. :00 and :30).
      // The slot must still fit entirely within the working window.
      let slotStart = ceilToGranularityUtc(
        winStart.getTime(),
        SLOT_GRANULARITY_MIN,
      );
      while (slotStart + durationMs <= winEnd.getTime()) {
        const slot: Slot = {
          start: new Date(slotStart),
          end: new Date(slotStart + durationMs),
        };

        // Filter: within effective window
        if (slot.start < effectiveFrom || slot.end > effectiveTo) {
          slotStart += granStepMs;
          continue;
        }
        // Filter: not blocked — fast-forward past the latest colliding block.
        const blockedEnd = blockedCollisionEnd(slot, blockedPeriods);
        if (blockedEnd !== null) {
          slotStart = ceilToGranularityUtc(blockedEnd, SLOT_GRANULARITY_MIN);
          continue;
        }
        // Filter: no buffered collision with existing — fast-forward past it.
        const existingEnd = existingCollisionEnd(
          slot,
          existingAppointments,
          bufferMinutes,
        );
        if (existingEnd !== null) {
          slotStart = ceilToGranularityUtc(existingEnd, SLOT_GRANULARITY_MIN);
          continue;
        }
        slots.push(slot);
        slotStart += granStepMs;
      }
    }
  }

  return slots;
}

/** Format a slot as a user-facing label in CLINIC_TZ, e.g. "9:00 AM" */
export function formatSlotTime(date: Date, locale: "es" | "en" = "es"): string {
  return formatTz(date, locale === "es" ? "HH:mm" : "h:mm a", {
    timeZone: CLINIC_TZ,
  });
}

/** Format a slot's calendar date in CLINIC_TZ, e.g. "lunes 12 de mayo" */
export function formatSlotDate(date: Date, locale: "es" | "en" = "es"): string {
  return formatTz(
    date,
    locale === "es" ? "EEEE d 'de' MMMM" : "EEEE, MMMM d",
    { timeZone: CLINIC_TZ },
  );
}

/** Group slots by clinic-local calendar day. Returns Map<YYYY-MM-DD, Slot[]>. */
export function groupSlotsByDay(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = formatTz(s.start, "yyyy-MM-dd", { timeZone: CLINIC_TZ });
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return map;
}
