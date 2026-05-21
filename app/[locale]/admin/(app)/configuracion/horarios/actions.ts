"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
const rangeSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRe),
  end_time: z.string().regex(timeRe),
});

export async function saveWorkingHours(formData: FormData) {
  await requireProfile();

  // Form encodes ranges as: ranges[i][day_of_week], ranges[i][start_time], ranges[i][end_time]
  // We extract all and validate.
  const map = new Map<
    string,
    { day_of_week?: string; start_time?: string; end_time?: string }
  >();
  for (const [k, v] of formData.entries()) {
    const m = /^ranges\[(\d+)\]\[(day_of_week|start_time|end_time)\]$/.exec(k);
    if (!m) continue;
    const idx = m[1]!;
    const field = m[2] as "day_of_week" | "start_time" | "end_time";
    const existing = map.get(idx) ?? {};
    existing[field] = String(v);
    map.set(idx, existing);
  }

  const parsed: z.infer<typeof rangeSchema>[] = [];
  for (const row of map.values()) {
    if (!row.day_of_week || !row.start_time || !row.end_time) continue;
    const candidate = rangeSchema.safeParse({
      day_of_week: Number(row.day_of_week),
      start_time: row.start_time,
      end_time: row.end_time,
    });
    if (!candidate.success) continue;
    if (candidate.data.end_time <= candidate.data.start_time) continue;
    parsed.push(candidate.data);
  }

  const supabase = createAdminClient();
  // Replace strategy: delete all, insert new
  await supabase.from("working_hours").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (parsed.length > 0) {
    await supabase.from("working_hours").insert(
      parsed.map((r) => ({
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
        is_active: true,
      })),
    );
  }
  revalidatePath("/admin/configuracion/horarios");
  revalidatePath("/agendar");
}
