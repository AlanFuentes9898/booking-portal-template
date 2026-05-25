"use client";

import {
  Stethoscope,
  Video,
  MapPin,
  CalendarDays,
  Clock,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es, enUS } from "date-fns/locale";
import { publicEnv } from "@/lib/env";

const CLINIC_TZ = publicEnv.NEXT_PUBLIC_TIMEZONE;

export type SummaryState = {
  typeName: string | null;
  durationMinutes: number | null;
  priceMxn: number | null;
  showPrice: boolean;
  modality: "in_person" | "virtual" | null;
  startIso: string | null;
  patientName: string | null;
};

export function BookingSummary({
  state,
  locale,
  cancellationPolicy,
  officeCity,
  emptyHint,
}: {
  state: SummaryState;
  locale: "es" | "en";
  cancellationPolicy: string;
  officeCity: string;
  emptyHint?: string;
}) {
  const fnsLocale = locale === "es" ? es : enUS;
  const dateLabel = state.startIso
    ? formatInTimeZone(
        state.startIso,
        CLINIC_TZ,
        locale === "es" ? "EEEE d 'de' MMMM" : "EEEE, MMMM d",
        { locale: fnsLocale },
      )
    : null;
  const timeLabel = state.startIso
    ? formatInTimeZone(state.startIso, CLINIC_TZ, "HH:mm")
    : null;

  const empty =
    !state.typeName && !state.modality && !state.startIso && !state.patientName;

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-3xl border border-[color:var(--color-brand-ink)]/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-brand-pink)]">
          {locale === "es" ? "Resumen" : "Summary"}
        </p>
        <h3 className="mt-1 text-xl font-semibold">
          {locale === "es" ? "Tu cita" : "Your booking"}
        </h3>

        {empty && (
          <p className="mt-5 text-sm text-[color:var(--color-brand-muted)]">
            {emptyHint ??
              (locale === "es"
                ? "Conforme vayas eligiendo, verás aquí los detalles."
                : "As you choose, your details will appear here.")}
          </p>
        )}

        {!empty && (
          <ul className="mt-5 space-y-4 text-sm">
            {state.typeName && (
              <Row
                icon={<Stethoscope size={16} />}
                label={locale === "es" ? "Servicio" : "Service"}
                value={
                  <>
                    {state.typeName}
                    {state.durationMinutes && (
                      <span className="text-[color:var(--color-brand-muted)]">
                        {" · "}
                        {state.durationMinutes} min
                      </span>
                    )}
                  </>
                }
              />
            )}
            {state.modality && (
              <Row
                icon={
                  state.modality === "virtual" ? (
                    <Video size={16} />
                  ) : (
                    <MapPin size={16} />
                  )
                }
                label={locale === "es" ? "Modalidad" : "Modality"}
                value={
                  state.modality === "virtual"
                    ? locale === "es"
                      ? "Virtual (Google Meet)"
                      : "Virtual (Google Meet)"
                    : locale === "es"
                      ? "Presencial"
                      : "In person"
                }
              />
            )}
            {dateLabel && (
              <Row
                icon={<CalendarDays size={16} />}
                label={locale === "es" ? "Fecha" : "Date"}
                value={<span className="capitalize">{dateLabel}</span>}
              />
            )}
            {timeLabel && (
              <Row
                icon={<Clock size={16} />}
                label={locale === "es" ? "Hora" : "Time"}
                value={`${timeLabel} (${officeCity})`}
              />
            )}
            {state.patientName && (
              <Row
                icon={<UserRound size={16} />}
                label={locale === "es" ? "Paciente" : "Patient"}
                value={state.patientName}
              />
            )}
          </ul>
        )}

        {state.showPrice && state.priceMxn != null && (
          <div className="mt-6 pt-5 border-t border-dashed border-[color:var(--color-brand-ink)]/10 flex items-baseline justify-between">
            <span className="text-sm text-[color:var(--color-brand-muted)]">
              {locale === "es" ? "Total" : "Total"}
            </span>
            <span className="text-2xl font-semibold tracking-tight">
              ${state.priceMxn.toLocaleString("es-MX")}{" "}
              <span className="text-sm font-medium text-[color:var(--color-brand-muted)]">
                MXN
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-[color:var(--color-brand-green-soft)]/40 p-4 flex items-start gap-3">
        <ShieldCheck
          size={18}
          className="text-[color:var(--color-brand-ink)]/70 mt-0.5 flex-shrink-0"
        />
        <p className="text-xs text-[color:var(--color-brand-ink)]/75 leading-relaxed">
          {cancellationPolicy}
        </p>
      </div>
    </aside>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-green-soft)]/50 text-[color:var(--color-brand-ink)]/80 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-medium">
          {label}
        </p>
        <p className="text-[color:var(--color-brand-ink)] font-medium leading-snug">
          {value}
        </p>
      </div>
    </li>
  );
}
