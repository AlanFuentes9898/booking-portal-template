"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SettingsForm } from "@/components/admin/settings-form";
import { saveGeneralSettings } from "./actions";
import type { AppSettings } from "@/lib/settings";

export function GeneralForm({
  settings: s,
  showWhatsApp,
}: {
  settings: AppSettings;
  showWhatsApp: boolean;
}) {
  return (
    <SettingsForm
      action={saveGeneralSettings}
      successMessage="Configuración guardada"
      className="space-y-8"
    >
      {(state, pending) => (
        <>
          <Section
            title="Visibilidad pública"
            description="Controla qué información ve el paciente en el sitio."
          >
            <Toggle
              name="show_prices_publicly"
              label="Mostrar precios en el sitio"
              description="Si está desactivado, los precios solo se muestran al confirmar la cita."
              checked={s.show_prices_publicly}
            />
          </Section>

          <Section
            title="Integraciones"
            description="Activa o desactiva funcionalidades opcionales."
          >
            <Toggle
              name="payments_enabled"
              label="Pagos en línea"
              description="Actívalo para cobrar al agendar (requiere la integración de pagos habilitada)."
              checked={s.payments_enabled}
            />
            {showWhatsApp && (
              <Toggle
                name="whatsapp_enabled"
                label="Notificaciones por WhatsApp"
                description="Requiere que la integración de WhatsApp esté habilitada."
                checked={s.whatsapp_enabled}
              />
            )}
          </Section>

          <Section
            title="Reglas de agendado"
            description="Cómo se comporta el calendario público."
          >
            <Number
              name="buffer_minutes"
              label="Buffer entre citas"
              suffix="minutos"
              help="Tiempo libre que se agrega después de cada cita para preparar la siguiente."
              defaultValue={s.buffer_minutes}
              min={0}
              max={120}
            />
            <Number
              name="min_booking_hours_ahead"
              label="Anticipación mínima para agendar"
              suffix="horas"
              help="Cuántas horas antes de la cita puede agendarla un paciente. Útil para que no agenden con 5 minutos de anticipación."
              defaultValue={s.min_booking_hours_ahead}
              min={0}
              max={168}
            />
            <Number
              name="max_booking_days_ahead"
              label="Máximo de días en el futuro"
              suffix="días"
              help="Hasta qué tan adelante se pueden agendar citas (ej: 60 días = no se ven slots a más de 2 meses)."
              defaultValue={s.max_booking_days_ahead}
              min={1}
              max={365}
            />
            <Number
              name="cancellation_hours_limit"
              label="Límite para cancelar online"
              suffix="horas antes"
              help="Si la cita es en menos de X horas, el paciente ya no puede cancelar solo, debe contactarte."
              defaultValue={s.cancellation_hours_limit}
              min={0}
              max={168}
            />
          </Section>

          <Section
            title="Política de cancelación"
            description="Texto que se muestra al paciente. Hasta 2,000 caracteres por idioma."
          >
            <Field
              label="Español"
              help="Aparece en el flujo de reserva y en el email de confirmación."
              maxLength={2000}
              defaultValue={s.cancellation_policy_es}
              error={state.fieldErrors?.cancellation_policy_es}
            >
              <textarea
                name="cancellation_policy_es"
                defaultValue={s.cancellation_policy_es}
                rows={6}
                maxLength={2000}
                className="form-input"
              />
            </Field>
            <Field
              label="English"
              help="Shown in the booking flow and confirmation email."
              maxLength={2000}
              defaultValue={s.cancellation_policy_en}
              error={state.fieldErrors?.cancellation_policy_en}
            >
              <textarea
                name="cancellation_policy_en"
                defaultValue={s.cancellation_policy_en}
                rows={6}
                maxLength={2000}
                className="form-input"
              />
            </Field>
          </Section>

          <div className="flex justify-end gap-3">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>

          <style>{`
            .form-input {
              width: 100%;
              padding: 11px 14px;
              border-radius: 12px;
              border: 1px solid rgba(42,42,42,0.15);
              background: white;
              font-size: 14px;
              outline: none;
              transition: border-color .15s, box-shadow .15s;
            }
            .form-input:focus {
              border-color: var(--color-brand-green);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
            }
            .form-input[aria-invalid="true"] {
              border-color: var(--color-brand-pink);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-pink) 25%, transparent);
            }
          `}</style>
        </>
      )}
    </SettingsForm>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            {description}
          </p>
        )}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Toggle({
  name,
  label,
  description,
  checked,
}: {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span
        className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full bg-[color:var(--color-brand-ink)]/15 transition-colors peer-checked:bg-[color:var(--color-brand-green)] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        aria-hidden
      />
    </label>
  );
}

function Number({
  name,
  label,
  suffix,
  help,
  defaultValue,
  min,
  max,
}: {
  name: string;
  label: string;
  suffix?: string;
  help?: string;
  defaultValue: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {help && (
          <span className="block mt-0.5 text-xs text-[color:var(--color-brand-muted)] font-normal">
            {help}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          name={name}
          defaultValue={defaultValue}
          min={min}
          max={max}
          className="w-24 px-3 py-2 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm text-right tabular-nums"
        />
        {suffix && (
          <span className="text-xs text-[color:var(--color-brand-muted)] w-20">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}
