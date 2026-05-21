import { createAdminClient } from "@/lib/supabase/admin";
import { WorkingHoursEditor } from "./working-hours-editor";

export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("working_hours")
    .select("day_of_week,start_time,end_time")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const rows = (data ?? []).map((r) => ({
    day_of_week: r.day_of_week as number,
    start_time: r.start_time as string,
    end_time: r.end_time as string,
  }));

  return <WorkingHoursEditor initial={rows} />;
}
