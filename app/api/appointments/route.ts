import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAppointmentSchema } from "@/lib/schemas/booking";
import { createAppointment } from "@/lib/appointments";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const result = await createAppointment(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(
    {
      appointment_id: result.appointment_id,
      cancellation_token: result.cancellation_token,
      end_time: result.end_time,
    },
    { status: 201 },
  );
}
