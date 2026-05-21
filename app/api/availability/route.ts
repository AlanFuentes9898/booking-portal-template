import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAvailableSlots } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { availabilityQuerySchema } from "@/lib/schemas/booking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const parsed = availabilityQuerySchema.safeParse({
    appointment_type_id: sp.get("appointment_type_id"),
    date_from: sp.get("date_from"),
    date_to: sp.get("date_to"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const { appointment_type_id, date_from, date_to } = parsed.data;
  const dateFrom = new Date(date_from);
  const dateTo = new Date(date_to);

  // Hard guard: window not larger than 90 days
  if (dateTo.getTime() - dateFrom.getTime() > 90 * 86400_000) {
    return NextResponse.json(
      { error: "window_too_large" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const [typeRes, whRes, blockRes, apptRes, settings] = await Promise.all([
    supabase
      .from("appointment_types")
      .select("id,duration_minutes,is_active")
      .eq("id", appointment_type_id)
      .single(),
    supabase
      .from("working_hours")
      .select("day_of_week,start_time,end_time,is_active")
      .eq("is_active", true),
    supabase
      .from("blocked_periods")
      .select("start_time,end_time")
      .lt("start_time", dateTo.toISOString())
      .gt("end_time", dateFrom.toISOString()),
    supabase
      .from("appointments")
      .select("start_time,end_time,status")
      .in("status", ["confirmed", "completed"])
      .lt("start_time", dateTo.toISOString())
      .gt("end_time", dateFrom.toISOString()),
    getSettings(),
  ]);

  if (typeRes.error || !typeRes.data || !typeRes.data.is_active) {
    return NextResponse.json(
      { error: "appointment_type_not_found" },
      { status: 404 },
    );
  }
  if (whRes.error || blockRes.error || apptRes.error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const slots = computeAvailableSlots({
    dateFrom,
    dateTo,
    now: new Date(),
    config: {
      durationMinutes: typeRes.data.duration_minutes,
      bufferMinutes: settings.buffer_minutes,
      minBookingHoursAhead: settings.min_booking_hours_ahead,
      maxBookingDaysAhead: settings.max_booking_days_ahead,
    },
    workingHours: whRes.data ?? [],
    blockedPeriods: (blockRes.data ?? []).map((b) => ({
      start_time: new Date(b.start_time),
      end_time: new Date(b.end_time),
    })),
    existingAppointments: (apptRes.data ?? []).map((a) => ({
      start_time: new Date(a.start_time),
      end_time: new Date(a.end_time),
    })),
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
  });
}
