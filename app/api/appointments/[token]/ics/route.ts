import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildIcsEvent } from "@/lib/ics";
import { publicEnv } from "@/lib/env";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();
  const [{ data, error }, brand] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id,start_time,end_time,modality,meet_link, appointment_types ( name_es )",
      )
      .eq("cancellation_token", token)
      .maybeSingle(),
    getBrand(),
  ]);
  if (error || !data) {
    return new NextResponse("not found", { status: 404 });
  }
  const type = Array.isArray(data.appointment_types)
    ? data.appointment_types[0]
    : data.appointment_types;
  const summary = `${type?.name_es ?? "Cita"} — ${brand.name}`;
  const description =
    data.modality === "virtual" && data.meet_link
      ? `Sesión virtual\nMeet: ${data.meet_link}`
      : "Sesión presencial";

  const ics = buildIcsEvent({
    uid: `${data.id}@booking-portal`,
    start: new Date(data.start_time),
    end: new Date(data.end_time),
    summary,
    description,
    url: `${publicEnv.NEXT_PUBLIC_APP_URL}/cita/${token}`,
    brandName: brand.name,
  });
  // Filename slug from brand
  const slug = brand.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "cita";
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cita-${slug}.ics"`,
    },
  });
}
