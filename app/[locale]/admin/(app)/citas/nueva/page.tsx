import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewAppointmentForm, type ApptType } from "./new-appointment-form";
import type { PatientLite } from "./patient-picker";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ patient_id?: string }>;
};

export default async function NuevaCitaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = createAdminClient();
  const [typesRes, patientRes] = await Promise.all([
    supabase
      .from("appointment_types")
      .select("id,name_es,duration_minutes,price_mxn,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    sp.patient_id
      ? supabase
          .from("patients")
          .select("id,full_name,email,phone,sport")
          .eq("id", sp.patient_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const types = (typesRes.data ?? []) as ApptType[];
  const prefillPatient = (patientRes.data ?? null) as PatientLite | null;

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
      <Link
        href="/admin/citas"
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] mb-4"
      >
        <ArrowLeft size={14} /> Volver a citas
      </Link>

      <PageHeader
        title="Nueva cita"
        description={
          prefillPatient
            ? `Para ${prefillPatient.full_name}. Cambia de paciente si lo necesitas.`
            : "Agenda manualmente para un paciente existente o crea uno nuevo."
        }
      />

      {types.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-10 text-center text-sm text-[color:var(--color-brand-muted)]">
          No hay tipos de cita activos. Crea uno primero en{" "}
          <Link
            href="/admin/configuracion/tipos-cita"
            className="text-[color:var(--color-brand-pink)] hover:underline"
          >
            Configuración → Tipos de cita
          </Link>
          .
        </div>
      ) : (
        <NewAppointmentForm types={types} prefillPatient={prefillPatient} />
      )}
    </main>
  );
}
