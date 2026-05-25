"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatInTimeZone } from "date-fns-tz";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Video,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { patientSchema } from "@/lib/schemas/booking";
import { BookingStepper } from "./booking-stepper";
import { BookingCalendar, type Slot } from "./booking-calendar";
import { BookingSummary, type SummaryState } from "./booking-summary";
import { publicEnv } from "@/lib/env";

const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

export type WizardAppointmentType = {
  id: string;
  name_es: string;
  name_en: string | null;
  duration_minutes: number;
  price_mxn: number | null;
  is_for_new_patients: boolean;
  description_es: string | null;
  description_en: string | null;
};

export type WizardQuestion = {
  id: string;
  question_es: string;
  question_en: string | null;
  field_type: "text" | "textarea" | "number" | "select" | "checkbox" | "date";
  options: string[] | null;
  is_required: boolean;
};

type State = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  typeId: string | null;
  modality: "in_person" | "virtual" | null;
  selectedSlot: Slot | null;
  patient: z.infer<typeof patientSchema> | null;
  reason: string;
  questionnaire: Record<string, string | number | boolean>;
  result: { token: string; id: string } | null;
};

type Action =
  | { type: "TYPE"; id: string }
  | { type: "MODALITY"; m: "in_person" | "virtual" }
  | { type: "SLOT"; slot: Slot }
  | {
      type: "PATIENT";
      patient: z.infer<typeof patientSchema>;
      reason: string;
      questionnaire: Record<string, string | number | boolean>;
    }
  | { type: "GOTO"; step: State["step"] }
  | { type: "DONE"; token: string; id: string };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "TYPE":
      return { ...s, typeId: a.id, step: 2 };
    case "MODALITY":
      return { ...s, modality: a.m, step: 3 };
    case "SLOT":
      return { ...s, selectedSlot: a.slot, step: 4 };
    case "PATIENT":
      return {
        ...s,
        patient: a.patient,
        reason: a.reason,
        questionnaire: a.questionnaire,
        step: 5,
      };
    case "GOTO":
      return { ...s, step: a.step };
    case "DONE":
      return { ...s, result: { token: a.token, id: a.id }, step: 6 };
  }
}

const initial: State = {
  step: 1,
  typeId: null,
  modality: null,
  selectedSlot: null,
  patient: null,
  reason: "",
  questionnaire: {},
  result: null,
};

export function BookingWizard(props: {
  types: WizardAppointmentType[];
  questions: WizardQuestion[];
  showPrices: boolean;
  cancellationPolicy: string;
  officeCity: string;
}) {
  const locale = useLocale() as "es" | "en";
  const [state, dispatch] = useReducer(reducer, initial);

  const selectedType = useMemo(
    () => props.types.find((x) => x.id === state.typeId) ?? null,
    [props.types, state.typeId],
  );

  const summaryState: SummaryState = useMemo(
    () => ({
      typeName: selectedType
        ? locale === "en" && selectedType.name_en
          ? selectedType.name_en
          : selectedType.name_es
        : null,
      durationMinutes: selectedType?.duration_minutes ?? null,
      priceMxn: selectedType?.price_mxn ?? null,
      showPrice: props.showPrices,
      modality: state.modality,
      startIso: state.selectedSlot?.start ?? null,
      patientName: state.patient?.full_name ?? null,
    }),
    [selectedType, locale, props.showPrices, state],
  );

  // Step 6 (confirmation) gets a celebratory full-width layout
  if (state.step === 6 && state.result) {
    return (
      <StepConfirmation token={state.result.token} locale={locale} />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Title row */}
      <div className="mb-8 lg:mb-10 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)]">
          {locale === "es" ? "Agendar consulta" : "Book appointment"}
        </p>
        <h1 className="hero-title mt-2 text-3xl sm:text-4xl lg:text-5xl">
          {locale === "es"
            ? "Reserva tu cita en minutos"
            : "Book your appointment in minutes"}
        </h1>
      </div>

      {/* Stepper */}
      <BookingStepper current={state.step} locale={locale} />

      {/* Body: main + sidebar */}
      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">
        <main className="min-w-0">
          {state.step === 1 && (
            <StepType
              types={props.types}
              showPrices={props.showPrices}
              locale={locale}
              currentId={state.typeId}
              onPick={(id) => dispatch({ type: "TYPE", id })}
            />
          )}

          {state.step === 2 && (
            <StepModality
              locale={locale}
              current={state.modality}
              officeCity={props.officeCity}
              onBack={() => dispatch({ type: "GOTO", step: 1 })}
              onPick={(m) => dispatch({ type: "MODALITY", m })}
            />
          )}

          {state.step === 3 && state.typeId && (
            <StepDateTime
              typeId={state.typeId}
              locale={locale}
              current={state.selectedSlot}
              onBack={() => dispatch({ type: "GOTO", step: 2 })}
              onPick={(slot) => dispatch({ type: "SLOT", slot })}
            />
          )}

          {state.step === 4 && selectedType && (
            <StepPatient
              isFirst={selectedType.is_for_new_patients}
              questions={props.questions}
              locale={locale}
              defaults={state.patient}
              defaultReason={state.reason}
              onBack={() => dispatch({ type: "GOTO", step: 3 })}
              onSubmit={(patient, reason, questionnaire) =>
                dispatch({
                  type: "PATIENT",
                  patient,
                  reason,
                  questionnaire,
                })
              }
            />
          )}

          {state.step === 5 &&
            selectedType &&
            state.modality &&
            state.selectedSlot &&
            state.patient && (
              <StepSummary
                type={selectedType}
                modality={state.modality}
                slot={state.selectedSlot}
                patient={state.patient}
                reason={state.reason}
                questionnaire={state.questionnaire}
                locale={locale}
                onBack={() => dispatch({ type: "GOTO", step: 4 })}
                onDone={(token, id) =>
                  dispatch({ type: "DONE", token, id })
                }
              />
            )}
        </main>

        <BookingSummary
          state={summaryState}
          locale={locale}
          cancellationPolicy={props.cancellationPolicy}
          officeCity={props.officeCity}
        />
      </div>
    </div>
  );
}

/* ============ STEP 1: TYPE ============ */
function StepType(props: {
  types: WizardAppointmentType[];
  showPrices: boolean;
  locale: "es" | "en";
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">
        {props.locale === "es"
          ? "¿Qué tipo de consulta necesitas?"
          : "What type of consultation do you need?"}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
        {props.locale === "es"
          ? "Elige una opción para continuar."
          : "Pick one to continue."}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {props.types.map((tp) => {
          const name =
            props.locale === "en" && tp.name_en ? tp.name_en : tp.name_es;
          const description =
            props.locale === "en"
              ? tp.description_en ?? tp.description_es
              : tp.description_es;
          const selected = props.currentId === tp.id;
          return (
            <button
              key={tp.id}
              onClick={() => props.onPick(tp.id)}
              className={`text-left rounded-3xl bg-white p-6 border-2 transition-all ${
                selected
                  ? "border-[color:var(--color-brand-green)] shadow-md"
                  : "border-[color:var(--color-brand-ink)]/10 hover:border-[color:var(--color-brand-green)]/60 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold leading-tight">
                    {name}
                  </h3>
                  <p className="text-sm text-[color:var(--color-brand-muted)] mt-1">
                    {tp.duration_minutes} min
                    {tp.is_for_new_patients && (
                      <span className="ml-2 text-[color:var(--color-brand-pink)] font-medium">
                        ·{" "}
                        {props.locale === "es"
                          ? "pacientes nuevos"
                          : "new patients"}
                      </span>
                    )}
                  </p>
                </div>
                {props.showPrices && tp.price_mxn != null && (
                  <span className="text-base font-semibold whitespace-nowrap">
                    ${tp.price_mxn.toLocaleString("es-MX")}
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-3 text-sm text-[color:var(--color-brand-ink)]/75 leading-relaxed">
                  {description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============ STEP 2: MODALITY ============ */
function StepModality(props: {
  locale: "es" | "en";
  current: "in_person" | "virtual" | null;
  officeCity: string;
  onBack: () => void;
  onPick: (m: "in_person" | "virtual") => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">
        {props.locale === "es"
          ? "¿Cómo prefieres tu sesión?"
          : "How do you prefer your session?"}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
        {props.locale === "es"
          ? "Puedes cambiar esto después si lo necesitas."
          : "You can change this later if needed."}
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <ModalityCard
          selected={props.current === "in_person"}
          icon={<MapPin size={22} />}
          title={props.locale === "es" ? "Presencial" : "In person"}
          subtitle={
            props.locale === "es"
              ? `Consultorio en ${props.officeCity}`
              : `${props.officeCity} clinic`
          }
          onClick={() => props.onPick("in_person")}
        />
        <ModalityCard
          selected={props.current === "virtual"}
          icon={<Video size={22} />}
          title={props.locale === "es" ? "Virtual" : "Virtual"}
          subtitle={
            props.locale === "es"
              ? "Google Meet — desde donde estés"
              : "Google Meet — from anywhere"
          }
          onClick={() => props.onPick("virtual")}
        />
      </div>

      <NavRow onBack={props.onBack} locale={props.locale} />
    </section>
  );
}

function ModalityCard(props: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-3xl bg-white p-6 border-2 text-left transition-all ${
        props.selected
          ? "border-[color:var(--color-brand-green)] shadow-md"
          : "border-[color:var(--color-brand-ink)]/10 hover:border-[color:var(--color-brand-green)]/60 hover:shadow-sm"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)]">
        {props.icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{props.title}</h3>
      <p className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
        {props.subtitle}
      </p>
    </button>
  );
}

/* ============ STEP 3: DATE & TIME ============ */
function StepDateTime(props: {
  typeId: string;
  locale: "es" | "en";
  current: Slot | null;
  onBack: () => void;
  onPick: (slot: Slot) => void;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(
    props.current
      ? formatInTimeZone(props.current.start, CLINIC_TZ, "yyyy-MM-dd")
      : null,
  );

  useEffect(() => {
    const now = new Date();
    const from = now;
    const to = new Date(now.getTime() + 60 * 86400_000);
    const url = `/api/availability?appointment_type_id=${props.typeId}&date_from=${from.toISOString()}&date_to=${to.toISOString()}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSlots(d.slots);
        if (!selectedDay && d.slots[0]) {
          setSelectedDay(
            formatInTimeZone(d.slots[0].start, CLINIC_TZ, "yyyy-MM-dd"),
          );
        }
      })
      .catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.typeId]);

  const slotsForDay = useMemo(() => {
    if (!slots || !selectedDay) return [];
    return slots.filter(
      (s) =>
        formatInTimeZone(s.start, CLINIC_TZ, "yyyy-MM-dd") === selectedDay,
    );
  }, [slots, selectedDay]);

  const isLoading = !slots && !error;

  return (
    <section>
      <h2 className="text-2xl font-semibold">
        {props.locale === "es" ? "Elige fecha y hora" : "Pick date & time"}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
        {props.locale === "es"
          ? "Los días con disponibilidad aparecen resaltados."
          : "Days with availability are highlighted."}
      </p>

      {error && (
        <div className="mt-6 rounded-2xl bg-[color:var(--color-brand-pink-soft)]/40 border border-[color:var(--color-brand-pink)]/30 p-4 text-sm text-[color:var(--color-brand-ink)]">
          {props.locale === "es"
            ? "No pudimos cargar la disponibilidad. Intenta de nuevo."
            : "Couldn't load availability. Try again."}
        </div>
      )}

      {isLoading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-[color:var(--color-brand-muted)]">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm">
            {props.locale === "es" ? "Cargando…" : "Loading…"}
          </span>
        </div>
      )}

      {slots && slots.length === 0 && (
        <div className="mt-6 rounded-2xl bg-[color:var(--color-brand-green-soft)]/40 p-6 text-sm text-[color:var(--color-brand-ink)]">
          {props.locale === "es"
            ? "Sin disponibilidad en los próximos 60 días. Escríbenos por contacto."
            : "No availability in the next 60 days. Reach out via contact."}
        </div>
      )}

      {slots && slots.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1fr] lg:grid-cols-1 xl:grid-cols-[1fr_320px]">
          <BookingCalendar
            slots={slots}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            locale={props.locale}
          />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">
              {props.locale === "es" ? "Horarios disponibles" : "Available times"}
            </h3>
            {selectedDay && slotsForDay.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {slotsForDay.map((s) => {
                  const isSelected =
                    props.current?.start === s.start;
                  return (
                    <button
                      key={s.start}
                      onClick={() => props.onPick(s)}
                      className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
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
              <p className="mt-3 text-sm text-[color:var(--color-brand-muted)]">
                {props.locale === "es"
                  ? "Selecciona un día disponible en el calendario."
                  : "Pick an available day from the calendar."}
              </p>
            )}
          </div>
        </div>
      )}

      <NavRow onBack={props.onBack} locale={props.locale} />
    </section>
  );
}

/* ============ STEP 4: PATIENT ============ */
type PatientFormShape = z.infer<typeof patientSchema> & {
  reason?: string;
};

function StepPatient(props: {
  isFirst: boolean;
  questions: WizardQuestion[];
  locale: "es" | "en";
  defaults: z.infer<typeof patientSchema> | null;
  defaultReason: string;
  onBack: () => void;
  onSubmit: (
    patient: z.infer<typeof patientSchema>,
    reason: string,
    questionnaire: Record<string, string | number | boolean>,
  ) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormShape>({
    resolver: zodResolver(
      patientSchema.extend({ reason: z.string().optional() }),
    ),
    defaultValues: {
      full_name: props.defaults?.full_name ?? "",
      email: props.defaults?.email ?? "",
      phone: props.defaults?.phone ?? "",
      sport: props.defaults?.sport ?? "",
      reason: props.defaultReason,
    },
  });

  const [qa, setQa] = useState<Record<string, string | number | boolean>>({});
  const [qaError, setQaError] = useState<string | null>(null);

  function onValid(values: PatientFormShape) {
    setQaError(null);
    const { reason, ...patient } = values;
    if (props.isFirst) {
      for (const q of props.questions) {
        if (
          q.is_required &&
          (qa[q.id] === undefined || qa[q.id] === "")
        ) {
          setQaError(
            props.locale === "es"
              ? "Responde todas las preguntas obligatorias."
              : "Please answer all required questions.",
          );
          return;
        }
      }
    }
    props.onSubmit(patient, reason ?? "", props.isFirst ? qa : {});
  }

  return (
    <form onSubmit={handleSubmit(onValid)}>
      <h2 className="text-2xl font-semibold">
        {props.locale === "es" ? "Tus datos" : "Your details"}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
        {props.locale === "es"
          ? "Usaremos esto para enviarte la confirmación y recordatorios."
          : "We'll use this to send confirmation and reminders."}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label={props.locale === "es" ? "Nombre completo" : "Full name"}
          error={errors.full_name?.message}
        >
          <input type="text" {...register("full_name")} className="form-input" />
        </Field>
        <Field
          label="Email"
          error={errors.email?.message}
        >
          <input type="email" {...register("email")} className="form-input" />
        </Field>
        <Field
          label={
            props.locale === "es"
              ? "Teléfono (WhatsApp)"
              : "Phone (WhatsApp)"
          }
          error={errors.phone?.message}
        >
          <input type="tel" {...register("phone")} className="form-input" />
        </Field>
        <Field
          label={
            props.locale === "es" ? "Deporte (opcional)" : "Sport (optional)"
          }
        >
          <input type="text" {...register("sport")} className="form-input" />
        </Field>
      </div>

      <Field
        label={
          props.locale === "es"
            ? "¿Algo que quieras contarme antes? (opcional)"
            : "Anything you'd like to share? (optional)"
        }
        className="mt-5"
      >
        <textarea rows={3} {...register("reason")} className="form-input" />
      </Field>

      {props.isFirst && props.questions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">
            {props.locale === "es"
              ? "Cuestionario previo"
              : "Pre-consultation questionnaire"}
          </h3>
          <p className="text-sm text-[color:var(--color-brand-muted)] mt-1">
            {props.locale === "es"
              ? "Solo para pacientes nuevos. Nos ayuda a preparar mejor tu consulta."
              : "First-time only. Helps me prepare for your session."}
          </p>
          <div className="mt-5 space-y-5">
            {props.questions.map((q) => {
              const label =
                props.locale === "en" && q.question_en
                  ? q.question_en
                  : q.question_es;
              return (
                <Field
                  key={q.id}
                  label={`${label}${q.is_required ? " *" : ""}`}
                >
                  {q.field_type === "textarea" ? (
                    <textarea
                      rows={3}
                      className="form-input"
                      onChange={(e) =>
                        setQa((p) => ({ ...p, [q.id]: e.target.value }))
                      }
                    />
                  ) : q.field_type === "number" ? (
                    <input
                      type="number"
                      className="form-input"
                      onChange={(e) =>
                        setQa((p) => ({
                          ...p,
                          [q.id]: Number(e.target.value),
                        }))
                      }
                    />
                  ) : q.field_type === "checkbox" ? (
                    <input
                      type="checkbox"
                      className="size-5"
                      onChange={(e) =>
                        setQa((p) => ({ ...p, [q.id]: e.target.checked }))
                      }
                    />
                  ) : q.field_type === "date" ? (
                    <input
                      type="date"
                      className="form-input"
                      onChange={(e) =>
                        setQa((p) => ({ ...p, [q.id]: e.target.value }))
                      }
                    />
                  ) : q.field_type === "select" && q.options ? (
                    <select
                      className="form-input"
                      onChange={(e) =>
                        setQa((p) => ({ ...p, [q.id]: e.target.value }))
                      }
                    >
                      <option value="">—</option>
                      {q.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      onChange={(e) =>
                        setQa((p) => ({ ...p, [q.id]: e.target.value }))
                      }
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </div>
      )}

      {qaError && (
        <p className="mt-4 text-sm text-[color:var(--color-brand-pink)]">
          {qaError}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" type="button" onClick={props.onBack}>
          <ArrowLeft size={16} /> {props.locale === "es" ? "Atrás" : "Back"}
        </Button>
        <Button type="submit">
          {props.locale === "es" ? "Continuar" : "Continue"}{" "}
          <ArrowRight size={16} />
        </Button>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid rgba(42,42,42,0.15);
          background: white;
          font-size: 15px;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .form-input:focus {
          border-color: var(--color-brand-green);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-[color:var(--color-brand-pink)] mt-1">
          {error}
        </span>
      )}
    </label>
  );
}

/* ============ STEP 5: SUMMARY (review + confirm) ============ */
function StepSummary(props: {
  type: WizardAppointmentType;
  modality: "in_person" | "virtual";
  slot: Slot;
  patient: z.infer<typeof patientSchema>;
  reason: string;
  questionnaire: Record<string, string | number | boolean>;
  locale: "es" | "en";
  onBack: () => void;
  onDone: (token: string, id: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_type_id: props.type.id,
          modality: props.modality,
          start_time: props.slot.start,
          patient: props.patient,
          patient_reason: props.reason || undefined,
          questionnaire_response: props.questionnaire,
          locale: props.locale,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(
          data.error === "slot_unavailable"
            ? props.locale === "es"
              ? "Ese horario ya no está disponible. Vuelve atrás y elige otro."
              : "That slot is no longer available. Go back and pick another."
            : props.locale === "es"
              ? "No pudimos confirmar la cita. Intenta de nuevo."
              : "Couldn't confirm. Please try again.",
        );
        setSubmitting(false);
        return;
      }
      props.onDone(data.cancellation_token, data.appointment_id);
    } catch {
      setError(props.locale === "es" ? "Error de red." : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">
        {props.locale === "es" ? "Revisa y confirma" : "Review and confirm"}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
        {props.locale === "es"
          ? "Verifica los datos. Recibirás confirmación por correo."
          : "Double-check the details. You'll get a confirmation email."}
      </p>

      <div className="mt-6 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/10 p-6 space-y-4">
        <ReviewRow
          label={props.locale === "es" ? "Paciente" : "Patient"}
          value={
            <>
              {props.patient.full_name}
              <br />
              <span className="text-[color:var(--color-brand-muted)] text-sm">
                {props.patient.email} · {props.patient.phone}
              </span>
            </>
          }
        />
        {props.reason && (
          <ReviewRow
            label={props.locale === "es" ? "Comentario" : "Comment"}
            value={
              <span className="text-sm text-[color:var(--color-brand-ink)]/80">
                {props.reason}
              </span>
            }
          />
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-[color:var(--color-brand-pink-soft)]/40 border border-[color:var(--color-brand-pink)]/30 p-4 text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" type="button" onClick={props.onBack}>
          <ArrowLeft size={16} /> {props.locale === "es" ? "Atrás" : "Back"}
        </Button>
        <Button onClick={submit} disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={16} />{" "}
              {props.locale === "es" ? "Confirmando…" : "Confirming…"}
            </>
          ) : (
            <>
              {props.locale === "es" ? "Confirmar cita" : "Confirm booking"}{" "}
              <CheckCircle2 size={16} />
            </>
          )}
        </Button>
      </div>
    </section>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold pt-1 w-24 flex-shrink-0">
        {label}
      </span>
      <div className="text-right text-[color:var(--color-brand-ink)] font-medium">
        {value}
      </div>
    </div>
  );
}

/* ============ STEP 6: CONFIRMATION ============ */
function StepConfirmation({
  token,
  locale,
}: {
  token: string;
  locale: "es" | "en";
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[color:var(--color-brand-green)] flex items-center justify-center shadow-lg shadow-[color:var(--color-brand-green)]/30">
        <CheckCircle2
          size={40}
          className="text-[color:var(--color-brand-ink)]"
        />
      </div>
      <h1 className="hero-title text-3xl sm:text-4xl">
        {locale === "es" ? "¡Cita confirmada!" : "Booking confirmed!"}
      </h1>
      <p className="mt-4 text-[color:var(--color-brand-ink)]/75">
        {locale === "es"
          ? "Revisa tu correo para los detalles y enlace de gestión. Te enviamos también recordatorios antes de tu cita."
          : "Check your email for details and the management link. We also send reminders before your session."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <a href={`/api/appointments/${token}/ics`}>
            {locale === "es" ? "Descargar .ics" : "Download .ics"}
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/cita/${token}`}>
            {locale === "es" ? "Ver mi cita" : "View my booking"}
          </Link>
        </Button>
      </div>
      <div className="mt-12 flex justify-center gap-5 text-sm">
        {/* Social links removed — wizard is a Client Component without access
            to DB settings. The contacto page already shows them dynamically. */}
        <Link
          href="/contacto"
          className="text-[color:var(--color-brand-pink)] hover:underline"
        >
          {locale === "es" ? "Contacto" : "Contact"}
        </Link>
      </div>
    </div>
  );
}

/* ============ shared NavRow ============ */
function NavRow({
  onBack,
  locale,
}: {
  onBack: () => void;
  locale: "es" | "en";
}) {
  return (
    <div className="mt-8 flex">
      <Button variant="ghost" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> {locale === "es" ? "Atrás" : "Back"}
      </Button>
    </div>
  );
}
