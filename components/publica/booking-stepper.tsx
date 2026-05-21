"use client";

import {
  Check,
  Stethoscope,
  Video,
  CalendarDays,
  UserRound,
  ClipboardCheck,
} from "lucide-react";

export type StepKey =
  | "service"
  | "modality"
  | "datetime"
  | "patient"
  | "summary";

const STEPS: { key: StepKey; icon: React.ElementType }[] = [
  { key: "service", icon: Stethoscope },
  { key: "modality", icon: Video },
  { key: "datetime", icon: CalendarDays },
  { key: "patient", icon: UserRound },
  { key: "summary", icon: ClipboardCheck },
];

const LABELS_ES: Record<StepKey, string> = {
  service: "Servicio",
  modality: "Modalidad",
  datetime: "Fecha y hora",
  patient: "Tus datos",
  summary: "Resumen",
};

const LABELS_EN: Record<StepKey, string> = {
  service: "Service",
  modality: "Modality",
  datetime: "Date & time",
  patient: "Your details",
  summary: "Summary",
};

export function BookingStepper({
  current,
  locale,
}: {
  /** 1-based step index (1..5) */
  current: number;
  locale: "es" | "en";
}) {
  const labels = locale === "es" ? LABELS_ES : LABELS_EN;

  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop / tablet: connected pills */}
      <ol className="hidden md:flex items-center w-full">
        {STEPS.map((step, i) => {
          const n = i + 1;
          const isDone = n < current;
          const isActive = n === current;
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex-1 flex items-center min-w-0">
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] shadow-sm"
                    : isDone
                      ? "bg-[color:var(--color-brand-green-soft)] text-[color:var(--color-brand-ink)]"
                      : "bg-transparent text-[color:var(--color-brand-muted)]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-white/70"
                      : isDone
                        ? "bg-white"
                        : "bg-[color:var(--color-brand-ink)]/5"
                  }`}
                >
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">
                  <span className="hidden lg:inline">{n}. </span>
                  {labels[step.key]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-1 ${
                    n < current
                      ? "bg-[color:var(--color-brand-green)]"
                      : "bg-[color:var(--color-brand-ink)]/10"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact label + dot progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[color:var(--color-brand-muted)]">
            {locale === "es" ? "Paso" : "Step"} {current} / {STEPS.length}
          </span>
          <span className="font-semibold text-[color:var(--color-brand-ink)]">
            {labels[STEPS[current - 1]!.key]}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i + 1 <= current
                  ? "bg-[color:var(--color-brand-green)]"
                  : "bg-[color:var(--color-brand-ink)]/10"
              }`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
