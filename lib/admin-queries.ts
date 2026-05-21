import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { CLINIC_TZ } from "@/lib/time";

export type AdminAppointmentRow = {
  id: string;
  start_time: string;
  end_time: string;
  modality: "in_person" | "virtual";
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  payment_status: string;
  amount_paid: number | null;
  meet_link: string | null;
  patient: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    sport: string | null;
    is_new: boolean;
  } | null;
  appointment_type: {
    id: string;
    name_es: string;
    name_en: string | null;
    duration_minutes: number;
    price_mxn: number | null;
    color_hex: string | null;
  } | null;
};

type RawAppointmentJoin = {
  id: string;
  start_time: string;
  end_time: string;
  modality: "in_person" | "virtual";
  status: AdminAppointmentRow["status"];
  payment_status: string;
  amount_paid: number | null;
  meet_link: string | null;
  patients: AdminAppointmentRow["patient"] | AdminAppointmentRow["patient"][] | null;
  appointment_types:
    | AdminAppointmentRow["appointment_type"]
    | AdminAppointmentRow["appointment_type"][]
    | null;
};

function flatten(row: RawAppointmentJoin): AdminAppointmentRow {
  const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
  const type = Array.isArray(row.appointment_types)
    ? row.appointment_types[0]
    : row.appointment_types;
  return {
    id: row.id,
    start_time: row.start_time,
    end_time: row.end_time,
    modality: row.modality,
    status: row.status,
    payment_status: row.payment_status,
    amount_paid: row.amount_paid,
    meet_link: row.meet_link,
    patient: patient ?? null,
    appointment_type: type ?? null,
  };
}

const SELECT_FRAGMENT =
  "id,start_time,end_time,modality,status,payment_status,amount_paid,meet_link," +
  "patients ( id, full_name, email, phone, sport, is_new )," +
  "appointment_types ( id, name_es, name_en, duration_minutes, price_mxn, color_hex )";

/** Clinic-local "today" boundary as UTC instants. */
function clinicTodayRangeUtc(): { startUtc: Date; endUtc: Date } {
  const todayLocal = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
  const startUtc = fromZonedTime(`${todayLocal}T00:00:00`, CLINIC_TZ);
  const endUtc = new Date(startUtc.getTime() + 24 * 3600_000);
  return { startUtc, endUtc };
}

export async function getTodayAppointments(): Promise<AdminAppointmentRow[]> {
  const supabase = createAdminClient();
  const { startUtc, endUtc } = clinicTodayRangeUtc();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_FRAGMENT)
    .gte("start_time", startUtc.toISOString())
    .lt("start_time", endUtc.toISOString())
    .in("status", ["confirmed", "completed", "no_show"])
    .order("start_time", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as RawAppointmentJoin[]).map(flatten);
}

export async function getUpcomingAppointments(
  days = 7,
): Promise<AdminAppointmentRow[]> {
  const supabase = createAdminClient();
  const { endUtc: todayEnd } = clinicTodayRangeUtc();
  const until = new Date(todayEnd.getTime() + (days - 1) * 86400_000);
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_FRAGMENT)
    .gte("start_time", todayEnd.toISOString())
    .lt("start_time", until.toISOString())
    .eq("status", "confirmed")
    .order("start_time", { ascending: true })
    .limit(30);
  if (error || !data) return [];
  return (data as unknown as RawAppointmentJoin[]).map(flatten);
}

export type MonthStats = {
  newPatients: number;
  completed: number;
  confirmed: number;
  cancelled: number;
  incomeMxn: number;
};

export async function getThisMonthStats(): Promise<MonthStats> {
  const supabase = createAdminClient();
  const todayLocal = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
  const monthStart = `${todayLocal.slice(0, 7)}-01`;
  const startUtc = fromZonedTime(`${monthStart}T00:00:00`, CLINIC_TZ);

  // Compute next month's first day
  const [year, month] = monthStart.split("-").map(Number) as [number, number];
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextLocal = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const endUtc = fromZonedTime(`${nextLocal}T00:00:00`, CLINIC_TZ);

  const [patientsRes, apptsRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startUtc.toISOString())
      .lt("created_at", endUtc.toISOString()),
    supabase
      .from("appointments")
      .select("status,amount_paid")
      .gte("start_time", startUtc.toISOString())
      .lt("start_time", endUtc.toISOString()),
  ]);

  const newPatients = patientsRes.count ?? 0;
  const appts = apptsRes.data ?? [];

  let completed = 0;
  let confirmed = 0;
  let cancelled = 0;
  let incomeMxn = 0;
  for (const a of appts) {
    if (a.status === "completed") completed++;
    if (a.status === "confirmed") confirmed++;
    if (a.status === "cancelled") cancelled++;
    if (a.amount_paid) incomeMxn += Number(a.amount_paid);
  }

  return { newPatients, completed, confirmed, cancelled, incomeMxn };
}

/** List all appointments for the admin table. */
export type AppointmentListFilters = {
  status?: AdminAppointmentRow["status"] | "all";
  modality?: "all" | "in_person" | "virtual";
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export async function listAppointments(
  f: AppointmentListFilters = {},
): Promise<AdminAppointmentRow[]> {
  const supabase = createAdminClient();
  let q = supabase.from("appointments").select(SELECT_FRAGMENT);
  if (f.status && f.status !== "all") q = q.eq("status", f.status);
  if (f.modality && f.modality !== "all") q = q.eq("modality", f.modality);
  if (f.from) q = q.gte("start_time", f.from);
  if (f.to) q = q.lt("start_time", f.to);
  q = q
    .order("start_time", { ascending: false })
    .limit(f.limit ?? 100);
  const { data, error } = await q;
  if (error || !data) return [];
  let rows = (data as unknown as RawAppointmentJoin[]).map(flatten);
  if (f.search) {
    const needle = f.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.patient?.full_name.toLowerCase().includes(needle) ||
        r.patient?.email.toLowerCase().includes(needle) ||
        r.patient?.phone.includes(needle),
    );
  }
  return rows;
}

export async function getAppointmentById(
  id: string,
): Promise<
  | (AdminAppointmentRow & {
      patient_reason: string | null;
      admin_notes: string | null;
      cancellation_token: string;
      questionnaire_response: Record<string, unknown> | null;
    })
  | null
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      SELECT_FRAGMENT +
        ", patient_reason, admin_notes, cancellation_token, questionnaire_response",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as RawAppointmentJoin & {
    patient_reason: string | null;
    admin_notes: string | null;
    cancellation_token: string;
    questionnaire_response: Record<string, unknown> | null;
  };
  return {
    ...flatten(row),
    patient_reason: row.patient_reason,
    admin_notes: row.admin_notes,
    cancellation_token: row.cancellation_token,
    questionnaire_response: row.questionnaire_response,
  };
}

/* ============ PATIENTS ============ */

export type PatientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  birthdate: string | null;
  sport: string | null;
  is_new: boolean;
  admin_notes: string | null;
  created_at: string;
};

export async function listPatients(search?: string): Promise<PatientRow[]> {
  const supabase = createAdminClient();
  let q = supabase.from("patients").select("*").order("created_at", {
    ascending: false,
  }).limit(200);
  if (search) {
    const s = search.replace(/[%_]/g, "");
    q = q.or(
      `full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`,
    );
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data as PatientRow[];
}

export async function getPatient(
  id: string,
): Promise<
  | (PatientRow & { history: AdminAppointmentRow[] })
  | null
> {
  const supabase = createAdminClient();
  const [pRes, hRes] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("appointments")
      .select(SELECT_FRAGMENT)
      .eq("patient_id", id)
      .order("start_time", { ascending: false })
      .limit(50),
  ]);
  if (pRes.error || !pRes.data) return null;
  const history = (hRes.data ?? []) as unknown as RawAppointmentJoin[];
  return {
    ...(pRes.data as PatientRow),
    history: history.map(flatten),
  };
}
