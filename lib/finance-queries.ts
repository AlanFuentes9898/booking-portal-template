import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { CLINIC_TZ } from "@/lib/time";

export type FinanceRange = {
  /** Clinic-local YYYY-MM-DD (inclusive). */
  fromLocal: string;
  /** Clinic-local YYYY-MM-DD (inclusive). */
  toLocal: string;
};

export type FinanceBucket = { label: string; key: string; total: number };
export type FinanceGroup = { name: string; count: number; total: number };

export type FinanceSummary = {
  range: FinanceRange;
  totalRevenue: number;
  paidCount: number;
  outstandingAmount: number;
  outstandingCount: number;
  avgTicket: number;
  byPeriod: FinanceBucket[];
  byService: FinanceGroup[];
  byMethod: FinanceGroup[];
  granularity: "day" | "week" | "month";
};

export type OutstandingAppointment = {
  id: string;
  start_time: string;
  status: string;
  amount_due: number | null;
  patient_name: string;
  patient_email: string | null;
  type_name: string;
};

/** Convert clinic-local date strings to UTC ISO timestamps that bound the range. */
function rangeToUtc(range: FinanceRange): { startUtc: string; endUtc: string } {
  const start = fromZonedTime(`${range.fromLocal}T00:00:00`, CLINIC_TZ);
  // toLocal is inclusive — push to next day's midnight in clinic TZ
  const [y, m, d] = range.toLocal.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, m - 1, d));
  next.setUTCDate(next.getUTCDate() + 1);
  const nextLocal = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  const end = fromZonedTime(`${nextLocal}T00:00:00`, CLINIC_TZ);
  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}

function daysBetween(fromLocal: string, toLocal: string): number {
  const a = new Date(`${fromLocal}T00:00:00Z`).getTime();
  const b = new Date(`${toLocal}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86400_000) + 1);
}

function pickGranularity(fromLocal: string, toLocal: string): "day" | "week" | "month" {
  const days = daysBetween(fromLocal, toLocal);
  if (days <= 35) return "day";
  if (days <= 120) return "week";
  return "month";
}

function bucketKey(
  dateLocal: string,
  granularity: "day" | "week" | "month",
): string {
  if (granularity === "day") return dateLocal;
  if (granularity === "month") return dateLocal.slice(0, 7);
  // week — ISO-ish: use Monday as start
  const d = new Date(`${dateLocal}T00:00:00Z`);
  const dow = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1;
  d.setUTCDate(d.getUTCDate() - dow);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function bucketLabel(key: string, granularity: "day" | "week" | "month"): string {
  if (granularity === "month") {
    const [y, m] = key.split("-");
    return `${m}/${y!.slice(2)}`;
  }
  if (granularity === "week") {
    return key.slice(5);
  }
  return key.slice(5);
}

function clinicLocalDate(isoUtc: string): string {
  return formatInTimeZone(new Date(isoUtc), CLINIC_TZ, "yyyy-MM-dd");
}

export async function getFinanceSummary(
  range: FinanceRange,
): Promise<FinanceSummary> {
  const supabase = createAdminClient();
  const { startUtc, endUtc } = rangeToUtc(range);
  const granularity = pickGranularity(range.fromLocal, range.toLocal);

  // Paid appointments in range (use paid_at when present, fallback to start_time)
  const [paidRes, outRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id,paid_at,start_time,amount_paid,payment_method,appointment_types ( id, name_es )",
      )
      .eq("payment_status", "paid")
      .or(
        `and(paid_at.gte.${startUtc},paid_at.lt.${endUtc}),and(paid_at.is.null,start_time.gte.${startUtc},start_time.lt.${endUtc})`,
      ),
    supabase
      .from("appointments")
      .select(
        "id,start_time,amount_paid,appointment_types ( id, name_es, price_mxn )",
      )
      .eq("payment_status", "unpaid")
      .in("status", ["confirmed", "completed"])
      .gte("start_time", startUtc)
      .lt("start_time", endUtc),
  ]);

  type PaidRow = {
    id: string;
    paid_at: string | null;
    start_time: string;
    amount_paid: number | null;
    payment_method: string | null;
    appointment_types:
      | { id: string; name_es: string }
      | { id: string; name_es: string }[]
      | null;
  };
  type OutRow = {
    id: string;
    start_time: string;
    amount_paid: number | null;
    appointment_types:
      | { id: string; name_es: string; price_mxn: number | null }
      | { id: string; name_es: string; price_mxn: number | null }[]
      | null;
  };

  const paidRows: PaidRow[] = ((paidRes.data ?? []) as unknown as PaidRow[]) ?? [];
  const outRows: OutRow[] = ((outRes.data ?? []) as unknown as OutRow[]) ?? [];

  // Aggregate
  const byPeriodMap = new Map<string, number>();
  const byServiceMap = new Map<string, FinanceGroup>();
  const byMethodMap = new Map<string, FinanceGroup>();
  let totalRevenue = 0;
  let paidCount = 0;

  for (const r of paidRows) {
    const amount = Number(r.amount_paid ?? 0);
    if (!amount) continue;
    totalRevenue += amount;
    paidCount += 1;

    const refIso = r.paid_at ?? r.start_time;
    const dateLocal = clinicLocalDate(refIso);
    const key = bucketKey(dateLocal, granularity);
    byPeriodMap.set(key, (byPeriodMap.get(key) ?? 0) + amount);

    const type = Array.isArray(r.appointment_types)
      ? r.appointment_types[0]
      : r.appointment_types;
    const tName = type?.name_es ?? "Sin tipo";
    const tCur = byServiceMap.get(tName) ?? {
      name: tName,
      count: 0,
      total: 0,
    };
    tCur.count += 1;
    tCur.total += amount;
    byServiceMap.set(tName, tCur);

    const mName = (r.payment_method && r.payment_method.trim()) || "Sin método";
    const mCur = byMethodMap.get(mName) ?? {
      name: mName,
      count: 0,
      total: 0,
    };
    mCur.count += 1;
    mCur.total += amount;
    byMethodMap.set(mName, mCur);
  }

  let outstandingAmount = 0;
  let outstandingCount = 0;
  for (const r of outRows) {
    const type = Array.isArray(r.appointment_types)
      ? r.appointment_types[0]
      : r.appointment_types;
    const due = Number(r.amount_paid ?? type?.price_mxn ?? 0);
    outstandingCount += 1;
    if (due > 0) outstandingAmount += due;
  }

  // Build byPeriod as a dense series sorted ascending
  const byPeriod: FinanceBucket[] = densePeriodSeries(
    range,
    granularity,
    byPeriodMap,
  );

  const byService = Array.from(byServiceMap.values()).sort(
    (a, b) => b.total - a.total,
  );
  const byMethod = Array.from(byMethodMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  return {
    range,
    totalRevenue,
    paidCount,
    outstandingAmount,
    outstandingCount,
    avgTicket: paidCount > 0 ? totalRevenue / paidCount : 0,
    byPeriod,
    byService,
    byMethod,
    granularity,
  };
}

function densePeriodSeries(
  range: FinanceRange,
  granularity: "day" | "week" | "month",
  values: Map<string, number>,
): FinanceBucket[] {
  const out: FinanceBucket[] = [];
  const [fy, fm, fd] = range.fromLocal.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = range.toLocal.split("-").map(Number) as [number, number, number];
  const start = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td));

  if (granularity === "month") {
    const cur = new Date(Date.UTC(fy, fm - 1, 1));
    const last = new Date(Date.UTC(ty, tm - 1, 1));
    while (cur.getTime() <= last.getTime()) {
      const key = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`;
      out.push({
        key,
        label: bucketLabel(key, granularity),
        total: values.get(key) ?? 0,
      });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return out;
  }

  if (granularity === "week") {
    // Snap start back to Monday of its week
    const dow = start.getUTCDay() === 0 ? 6 : start.getUTCDay() - 1;
    const cur = new Date(start);
    cur.setUTCDate(cur.getUTCDate() - dow);
    while (cur.getTime() <= end.getTime()) {
      const key = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}-${String(cur.getUTCDate()).padStart(2, "0")}`;
      out.push({
        key,
        label: bucketLabel(key, granularity),
        total: values.get(key) ?? 0,
      });
      cur.setUTCDate(cur.getUTCDate() + 7);
    }
    return out;
  }

  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    const key = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}-${String(cur.getUTCDate()).padStart(2, "0")}`;
    out.push({
      key,
      label: bucketLabel(key, granularity),
      total: values.get(key) ?? 0,
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export async function listOutstandingAppointments(
  limit = 50,
): Promise<OutstandingAppointment[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id,start_time,status,amount_paid, patients ( full_name, email ), appointment_types ( name_es, price_mxn )",
    )
    .eq("payment_status", "unpaid")
    .in("status", ["confirmed", "completed"])
    .order("start_time", { ascending: false })
    .limit(limit);

  type Row = {
    id: string;
    start_time: string;
    status: string;
    amount_paid: number | null;
    patients:
      | { full_name: string; email: string }
      | { full_name: string; email: string }[]
      | null;
    appointment_types:
      | { name_es: string; price_mxn: number | null }
      | { name_es: string; price_mxn: number | null }[]
      | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => {
    const p = Array.isArray(r.patients) ? r.patients[0] : r.patients;
    const t = Array.isArray(r.appointment_types)
      ? r.appointment_types[0]
      : r.appointment_types;
    const due = r.amount_paid ?? t?.price_mxn ?? null;
    return {
      id: r.id,
      start_time: r.start_time,
      status: r.status,
      amount_due: due == null ? null : Number(due),
      patient_name: p?.full_name ?? "—",
      patient_email: p?.email ?? null,
      type_name: t?.name_es ?? "—",
    };
  });
}

/** Default range = current clinic-local month-to-date. */
export function defaultRange(): FinanceRange {
  const today = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
  const fromLocal = `${today.slice(0, 7)}-01`;
  return { fromLocal, toLocal: today };
}

const PRESETS = ["today", "week", "month", "year"] as const;
export type FinancePreset = (typeof PRESETS)[number];

export function presetRange(preset: FinancePreset): FinanceRange {
  const today = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
  if (preset === "today") return { fromLocal: today, toLocal: today };
  if (preset === "month") {
    return { fromLocal: `${today.slice(0, 7)}-01`, toLocal: today };
  }
  if (preset === "year") {
    return { fromLocal: `${today.slice(0, 4)}-01-01`, toLocal: today };
  }
  // week — last 7 days inclusive
  const t = new Date(`${today}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 6);
  const fromLocal = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
  return { fromLocal, toLocal: today };
}
