"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Send,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingCalendar, type Slot } from "@/components/publica/booking-calendar";
import {
  createAdminAppointmentAction,
  type CreateAdminApptState,
} from "./actions";
import {
  PatientPicker,
  type PatientLite,
  type PatientPickerValue,
} from "./patient-picker";
import { publicEnv } from "@/lib/env";

const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

export type ApptType = {
  id: string;
  name_es: string;
  duration_minutes: number;
  price_mxn: number | null;
  is_active: boolean;
};

const initialState: CreateAdminApptState = { ok: false, error: null };

export function NewAppointmentForm({
  types,
  prefillPatient,
}: {
  types: ApptType[];
  prefillPatient?: PatientLite | null;
}) {
  const [patient, setPatient] = useState<PatientPickerValue>(
    prefillPatient ? { kind: "existing", patient: prefillPatient } : null,
  );
  const [typeId, setTypeId] = useState<string>(
    types.find((t) => t.is_active)?.id ?? "",
  );
  const [modality, setModality] = useState<"in_person" | "virtual">("in_person");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [patientReason, setPatientReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [state, formAction, pending] = useActionState(
    createAdminAppointmentAction,
    initialState,
  );

  // Re-fetch slots when type changes
  useEffect(() => {
    if (!typeId) return;
    setLoadingSlots(true);
    setSlots(null);
    setSelectedSlot(null);
    const now = new Date();
    // Admin can also book in the past 24h (to log walk-ins), so go back 1 day
    const from = new Date(now.getTime() - 24 * 3600_000);
    const to = new Date(now.getTime() + 90 * 86400_000);
    const url = `/api/admin/availability?appointment_type_id=${typeId}&date_from=${from.toISOString()}&date_to=${to.toISOString()}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.slots) setSlots(d.slots);
      })
      .finally(() => setLoadingSlots(false));
  }, [typeId]);

  // Default day = first available
  useEffect(() => {
    if (!selectedDay && slots && slots.length > 0) {
      setSelectedDay(
        formatInTimeZone(slots[0]!.start, CLINIC_TZ, "yyyy-MM-dd"),
      );
    }
  }, [slots, selectedDay]);

  const slotsForDay = useMemo(() => {
    if (!slots || !selectedDay) return [];
    return slots.filter(
      (s) =>
        formatInTimeZone(s.start, CLINIC_TZ, "yyyy-MM-dd") === selectedDay,
    );
  }, [slots, selectedDay]);

  const selectedType = types.find((t) => t.id === typeId) ?? null;
  const canSubmit =
    patient !== null && typeId && modality && selectedSlot && !pending;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
      {/* Hidden fields for FormData */}
      <input type="hidden" name="appointment_type_id" value={typeId} />
      <input type="hidden" name="modality" value={modality} />
      {selectedSlot && (
        <input type="hidden" name="start_time" value={selectedSlot.start} />
      )}
      {patient?.kind === "existing" && (
        <input type="hidden" name="patient_id" value={patient.patient.id} />
      )}
      {patient?.kind === "new" && (
        <>
          <input
            type="hidden"
            name="patient_full_name"
            value={patient.full_name}
          />
          <input type="hidden" name="patient_email" value={patient.email} />
          <input type="hidden" name="patient_phone" value={patient.phone} />
          <input type="hidden" name="patient_sport" value={patient.sport} />
        </>
      )}
      <input type="hidden" name="admin_notes" value={adminNotes} />
      <input type="hidden" name="patient_reason" value={patientReason} />
      {/* Note: the toggle below directly controls a real checkbox below for the
          form value, no hidden input needed. */}

      {/* MAIN COLUMN */}
      <div className="space-y-6">
        {/* 1. Patient */}
        <Section title="Paciente" step="1">
          <PatientPicker
            initialPatient={prefillPatient ?? null}
            onChange={setPatient}
          />
        </Section>

        {/* 2. Type */}
        <Section title="Tipo de cita" step="2">
          <div className="grid sm:grid-cols-2 gap-3">
            {types
              .filter((t) => t.is_active)
              .map((t) => {
                const selected = typeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeId(t.id)}
                    className={`text-left rounded-2xl border-2 p-4 transition ${
                      selected
                        ? "border-[color:var(--color-brand-green)] bg-[color:var(--color-brand-green-soft)]/30"
                        : "border-[color:var(--color-brand-ink)]/10 hover:border-[color:var(--color-brand-green)]/60"
                    } bg-white`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-sm">{t.name_es}</p>
                      {t.price_mxn != null && (
                        <span className="text-sm font-semibold whitespace-nowrap">
                          ${t.price_mxn.toLocaleString("es-MX")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
                      {t.duration_minutes} min
                    </p>
                  </button>
                );
              })}
          </div>
        </Section>

        {/* 3. Modality */}
        <Section title="Modalidad" step="3">
          <div className="grid sm:grid-cols-2 gap-3">
            <ModalityCard
              selected={modality === "in_person"}
              icon={<MapPin size={18} />}
              title="Presencial"
              subtitle="Consultorio"
              onClick={() => setModality("in_person")}
            />
            <ModalityCard
              selected={modality === "virtual"}
              icon={<Video size={18} />}
              title="Virtual"
              subtitle="Google Meet"
              onClick={() => setModality("virtual")}
            />
          </div>
        </Section>

        {/* 4. Date + time */}
        <Section title="Fecha y hora" step="4">
          {loadingSlots && (
            <div className="flex items-center gap-2 text-sm text-[color:var(--color-brand-muted)] py-6 justify-center">
              <Loader2 className="animate-spin" size={16} /> Cargando
              disponibilidad…
            </div>
          )}
          {!loadingSlots && slots && slots.length === 0 && (
            <p className="text-sm text-[color:var(--color-brand-muted)] py-6 text-center">
              No hay slots libres en los próximos 90 días para este tipo de
              cita. Revisa tus horarios o bloqueos.
            </p>
          )}
          {!loadingSlots && slots && slots.length > 0 && (
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <BookingCalendar
                slots={slots}
                selectedDay={selectedDay}
                onSelectDay={(d) => {
                  setSelectedDay(d);
                  setSelectedSlot(null);
                }}
                locale="es"
              />
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-2">
                  Hora ({selectedDay ? "" : "elige día"})
                </h4>
                {selectedDay && slotsForDay.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {slotsForDay.map((s) => {
                      const isSelected = selectedSlot?.start === s.start;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition tabular-nums ${
                            isSelected
                              ? "border-[color:var(--color-brand-green)] bg-[color:var(--color-brand-green-soft)] shadow-sm"
                              : "border-[color:var(--color-brand-ink)]/10 hover:border-[color:var(--color-brand-green)]/70 bg-white"
                          }`}
                        >
                          {formatInTimeZone(s.start, CLINIC_TZ, "HH:mm")}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[color:var(--color-brand-muted)]">
                    {selectedDay
                      ? "Sin slots libres este día."
                      : "Selecciona un día disponible."}
                  </p>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* 5. Notes */}
        <Section title="Notas" step="5">
          <Field label="Notas privadas (solo admin)">
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Observaciones, plan, recordatorios..."
              className="form-input"
            />
          </Field>
          <Field label="Motivo / comentario del paciente (opcional)">
            <textarea
              rows={2}
              value={patientReason}
              onChange={(e) => setPatientReason(e.target.value)}
              placeholder="Lo que el paciente comentó al agendar..."
              className="form-input"
            />
          </Field>
          <style>{`
            .form-input {
              width: 100%;
              padding: 10px 12px;
              border-radius: 10px;
              border: 1px solid rgba(42,42,42,0.15);
              background: white;
              font-size: 14px;
              outline: none;
            }
            .form-input:focus {
              border-color: var(--color-brand-green);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
            }
          `}</style>
        </Section>
      </div>

      {/* SIDEBAR */}
      <aside className="lg:sticky lg:top-6 space-y-4">
        <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5">
          <h3 className="text-sm font-semibold mb-4">Resumen</h3>
          <dl className="space-y-3 text-sm">
            <Row
              icon={<CalendarDays size={14} />}
              label="Paciente"
              value={
                patient?.kind === "existing"
                  ? patient.patient.full_name
                  : patient?.kind === "new"
                    ? patient.full_name || "(faltan datos)"
                    : "—"
              }
            />
            <Row
              icon={<CalendarDays size={14} />}
              label="Tipo"
              value={
                selectedType
                  ? `${selectedType.name_es} · ${selectedType.duration_minutes}m`
                  : "—"
              }
            />
            <Row
              icon={
                modality === "virtual" ? (
                  <Video size={14} />
                ) : (
                  <MapPin size={14} />
                )
              }
              label="Modalidad"
              value={modality === "virtual" ? "Virtual" : "Presencial"}
            />
            <Row
              icon={<Clock size={14} />}
              label="Fecha y hora"
              value={
                selectedSlot
                  ? formatInTimeZone(
                      selectedSlot.start,
                      CLINIC_TZ,
                      "EEE d MMM · HH:mm",
                      { locale: es },
                    )
                  : "—"
              }
            />
          </dl>

          <label className="mt-5 flex items-start justify-between gap-3 cursor-pointer">
            <span className="text-sm">
              <span className="font-medium">Notificar al paciente</span>
              <span className="block text-xs text-[color:var(--color-brand-muted)]">
                Envía email de confirmación con enlace para gestionar.
              </span>
            </span>
            <input
              type="checkbox"
              name="send_confirmation_email"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                sendEmail
                  ? "bg-[color:var(--color-brand-green)]"
                  : "bg-[color:var(--color-brand-ink)]/15"
              } after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform ${
                sendEmail ? "after:translate-x-5" : ""
              }`}
              aria-hidden
            />
          </label>

          {state.error && (
            <p className="mt-4 text-xs text-[color:var(--color-brand-pink)] bg-[color:var(--color-brand-pink-soft)]/30 rounded-lg p-2.5">
              {state.error === "slot_unavailable"
                ? "Ese horario ya está ocupado. Elige otro."
                : state.error === "patient_required"
                  ? "Selecciona o crea un paciente."
                  : state.error === "patient_create_failed"
                    ? "No se pudo crear el paciente. ¿Email duplicado?"
                    : `Error: ${state.error}`}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            size="lg"
            className="mt-5 w-full"
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Creando…
              </>
            ) : (
              <>
                <Send size={15} /> Crear cita
              </>
            )}
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-5 sm:p-6">
      <header className="mb-4 flex items-center gap-2.5">
        <span className="h-7 w-7 rounded-full bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] text-xs font-semibold flex items-center justify-center">
          {step}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ModalityCard({
  selected,
  icon,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? "border-[color:var(--color-brand-green)] bg-[color:var(--color-brand-green-soft)]/30"
          : "border-[color:var(--color-brand-ink)]/10 hover:border-[color:var(--color-brand-green)]/60"
      } bg-white`}
    >
      <div className="flex items-center gap-2.5">
        <span className="h-9 w-9 rounded-lg bg-[color:var(--color-brand-green-soft)]/70 text-[color:var(--color-brand-ink)] flex items-center justify-center">
          {icon}
        </span>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-[color:var(--color-brand-muted)]">
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--color-brand-green-soft)]/40 text-[color:var(--color-brand-ink)]/70 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold">
          {label}
        </p>
        <p className="text-sm font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  );
}
