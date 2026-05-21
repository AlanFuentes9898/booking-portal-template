import { NextRequest, NextResponse } from "next/server";
import { cancelAppointmentByToken } from "@/lib/appointments";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await cancelAppointmentByToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
