import { describe, it, expect } from "vitest";
import {
  computeAvailableSlots,
  groupSlotsByDay,
  type WorkingHoursRow,
} from "./availability";
import { fromZonedTime } from "date-fns-tz";

const TZ = "America/Mexico_City";

// Helper: build a UTC Date from a CLINIC_TZ wall-clock string.
function mx(iso: string): Date {
  return fromZonedTime(iso, TZ);
}

const baseWorkingHours: WorkingHoursRow[] = [
  // Mon–Fri 09–14 and 16–19, Sat 10–13 (matches seed)
  { day_of_week: 1, start_time: "09:00", end_time: "14:00", is_active: true },
  { day_of_week: 1, start_time: "16:00", end_time: "19:00", is_active: true },
  { day_of_week: 2, start_time: "09:00", end_time: "14:00", is_active: true },
  { day_of_week: 2, start_time: "16:00", end_time: "19:00", is_active: true },
  { day_of_week: 3, start_time: "09:00", end_time: "14:00", is_active: true },
  { day_of_week: 3, start_time: "16:00", end_time: "19:00", is_active: true },
  { day_of_week: 4, start_time: "09:00", end_time: "14:00", is_active: true },
  { day_of_week: 4, start_time: "16:00", end_time: "19:00", is_active: true },
  { day_of_week: 5, start_time: "09:00", end_time: "14:00", is_active: true },
  { day_of_week: 5, start_time: "16:00", end_time: "19:00", is_active: true },
  { day_of_week: 6, start_time: "10:00", end_time: "13:00", is_active: true },
];

const cfg = {
  durationMinutes: 30,
  bufferMinutes: 10,
  minBookingHoursAhead: 0,
  maxBookingDaysAhead: 365,
};

describe("computeAvailableSlots — basic working day", () => {
  it("generates slots on a Tuesday with no conflicts", () => {
    // Tuesday 2026-06-02 in CLINIC_TZ
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-03T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: cfg,
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: [],
    });

    // Morning window 09–14 with 40-min step (30+10 buffer): expect slots at
    // 09:00, 09:40, 10:20, 11:00, 11:40, 12:20, 13:00 (13:30 fits since end ≤ 14)
    // Afternoon 16–19: 16:00, 16:40, 17:20, 18:00 (18:30 fits ≤19)
    expect(slots.length).toBeGreaterThan(0);
    const labels = slots.map((s) =>
      s.start.toISOString().replace(/.*T(\d{2}:\d{2}).*/, "$1"),
    );
    // 09:00 MX is 15:00 UTC (DST varies, MX is CST/UTC-6 — no DST since 2022)
    // So the morning first slot UTC time should be 15:00
    expect(labels[0]).toBe("15:00");
  });

  it("returns empty array for Sunday (no working hours)", () => {
    const dateFrom = mx("2026-06-07T00:00:00"); // Sunday
    const dateTo = mx("2026-06-08T00:00:00");
    const now = mx("2026-06-06T08:00:00");
    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: cfg,
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: [],
    });
    expect(slots).toHaveLength(0);
  });
});

describe("computeAvailableSlots — existing appointments + buffer", () => {
  it("excludes slots overlapping an existing appointment", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-03T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    // Existing booking 10:00–10:30 MX
    const existing = [
      {
        start_time: mx("2026-06-02T10:00:00"),
        end_time: mx("2026-06-02T10:30:00"),
      },
    ];

    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: cfg,
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: existing,
    });

    const offered = slots.map((s) =>
      s.start.toISOString().slice(11, 16),
    );
    // 09:00 MX = 15:00 UTC (ok), 09:40 MX = 15:40 (would end 16:10, collides with 16:00 padded existing? no - existing is 10:00)
    // The 09:40 MX slot is 09:40-10:10 MX. Existing padded is 09:50-10:40. They overlap → excluded.
    expect(offered).not.toContain("15:40"); // 09:40 MX
    // 10:20 MX = 16:20 UTC. Slot 10:20-10:50 MX. Padded existing 09:50-10:40. Overlap → excluded.
    expect(offered).not.toContain("16:20");
    // 11:00 MX = 17:00 UTC. Slot 11:00-11:30 MX. Padded existing 09:50-10:40. No overlap → included.
    expect(offered).toContain("17:00");
  });

  it("respects buffer between adjacent appointments", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-03T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    // Existing at 09:00–09:30 → next valid 09:40 (30+10 buffer)
    const existing = [
      {
        start_time: mx("2026-06-02T09:00:00"),
        end_time: mx("2026-06-02T09:30:00"),
      },
    ];
    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: cfg,
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: existing,
    });
    const offered = slots.map((s) => s.start.toISOString().slice(11, 16));
    // 09:00 MX collides exactly → excluded
    expect(offered).not.toContain("15:00");
    // 09:40 MX = 15:40 UTC: slot 09:40-10:10. Existing padded 08:50-09:40. Touching at 09:40 — NOT overlapping (strict <). Should be included.
    expect(offered).toContain("15:40");
  });
});

describe("computeAvailableSlots — blocked periods", () => {
  it("excludes slots inside a blocked period (hard boundary)", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-03T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    // Block 10:00–12:00 MX
    const blocked = [
      {
        start_time: mx("2026-06-02T10:00:00"),
        end_time: mx("2026-06-02T12:00:00"),
      },
    ];
    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: cfg,
      workingHours: baseWorkingHours,
      blockedPeriods: blocked,
      existingAppointments: [],
    });
    const offered = slots.map((s) => s.start.toISOString().slice(11, 16));
    // 10:20 MX (16:20 UTC), 11:00 MX (17:00), 11:40 (17:40) should be excluded
    expect(offered).not.toContain("16:20");
    expect(offered).not.toContain("17:00");
    expect(offered).not.toContain("17:40");
    // 12:20 MX = 18:20 UTC should be included (block ends 12:00)
    expect(offered).toContain("18:20");
  });
});

describe("computeAvailableSlots — min/max booking bounds", () => {
  it("enforces minBookingHoursAhead", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-03T00:00:00");
    const now = mx("2026-06-02T11:00:00"); // already past morning

    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: { ...cfg, minBookingHoursAhead: 4 },
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: [],
    });
    // minBooking = now + 4h = 15:00 MX. All morning slots excluded; afternoon should remain.
    const allAfterMin = slots.every(
      (s) => s.start.getTime() >= now.getTime() + 4 * 3600_000,
    );
    expect(allAfterMin).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("enforces maxBookingDaysAhead", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-12-31T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: { ...cfg, maxBookingDaysAhead: 7 },
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: [],
    });
    const maxInstant = now.getTime() + 7 * 86400_000;
    expect(slots.every((s) => s.start.getTime() <= maxInstant)).toBe(true);
  });
});

describe("groupSlotsByDay", () => {
  it("groups slots by clinic-local calendar day", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-04T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: cfg,
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: [],
    });
    const grouped = groupSlotsByDay(slots);
    expect(grouped.has("2026-06-02")).toBe(true);
    expect(grouped.has("2026-06-03")).toBe(true);
    expect(grouped.size).toBe(2);
  });
});

describe("computeAvailableSlots — 60-minute appointments (first consultation)", () => {
  it("generates fewer slots with longer duration", () => {
    const dateFrom = mx("2026-06-02T00:00:00");
    const dateTo = mx("2026-06-03T00:00:00");
    const now = mx("2026-06-01T08:00:00");

    const slots = computeAvailableSlots({
      dateFrom,
      dateTo,
      now,
      config: { ...cfg, durationMinutes: 60 },
      workingHours: baseWorkingHours,
      blockedPeriods: [],
      existingAppointments: [],
    });
    // 60+10=70min step. Morning 09–14 (300min) → floor(300/70)=4 slots starting at 09, 10:10, 11:20, 12:30
    // (12:30 + 60 = 13:30 ≤ 14 ✓)
    // Afternoon 16–19 (180min) → floor(180/70)=2 slots: 16:00, 17:10 (17:10+60=18:10 ≤19 ✓)
    expect(slots.length).toBe(6);
  });
});
