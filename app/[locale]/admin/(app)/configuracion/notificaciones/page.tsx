import { Mail, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/settings";
import { saveNotificationSettings } from "./actions";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Event = {
  key: string;
  emailField: string;
  whatsappField: string;
  title: string;
  description: string;
};

const EVENTS: Event[] = [
  {
    key: "booking",
    emailField: "notify_email_on_booking",
    whatsappField: "notify_whatsapp_on_booking",
    title: "Nueva cita agendada",
    description: "Cuando un paciente reserva una cita.",
  },
  {
    key: "cancellation",
    emailField: "notify_email_on_cancellation",
    whatsappField: "notify_whatsapp_on_cancellation",
    title: "Cita cancelada",
    description: "Cuando un paciente cancela desde su enlace.",
  },
  {
    key: "reminder",
    emailField: "notify_email_reminder_24h",
    whatsappField: "notify_whatsapp_reminder_24h",
    title: "Recordatorio 24h antes",
    description: "Recordatorio automático al paciente el día anterior.",
  },
];

export default async function NotificacionesPage() {
  const s = await getSettings();
  type SK = keyof typeof s;
  const showWhatsApp = publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP;

  return (
    <form action={saveNotificationSettings} className="space-y-6">
      <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
        <header className="mb-5">
          <h2 className="text-base font-semibold">Canales por evento</h2>
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            {showWhatsApp
              ? "Decide qué notificación se envía y por qué canal. WhatsApp requiere que la integración esté activada en la pestaña General."
              : "Decide qué eventos disparan notificaciones por email."}
          </p>
        </header>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                <th className="pb-3 font-semibold">Evento</th>
                <th className="pb-3 font-semibold text-center w-24">
                  <span className="inline-flex items-center gap-1 justify-center">
                    <Mail size={12} /> Email
                  </span>
                </th>
                {showWhatsApp && (
                  <th className="pb-3 font-semibold text-center w-28">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <Phone size={12} /> WhatsApp
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-brand-ink)]/5">
              {EVENTS.map((e) => (
                <tr key={e.key}>
                  <td className="py-4">
                    <p className="font-medium text-sm">{e.title}</p>
                    <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
                      {e.description}
                    </p>
                  </td>
                  <td className="py-4 text-center">
                    <ToggleCell
                      name={e.emailField}
                      checked={Boolean(s[e.emailField as SK])}
                    />
                  </td>
                  {showWhatsApp && (
                    <td className="py-4 text-center">
                      <ToggleCell
                        name={e.whatsappField}
                        checked={Boolean(s[e.whatsappField as SK])}
                        disabled={!s.whatsapp_enabled}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showWhatsApp && !s.whatsapp_enabled && (
          <div className="mt-5 flex items-start gap-2.5 text-xs text-[color:var(--color-brand-muted)] rounded-xl bg-[color:var(--color-brand-green-soft)]/30 p-3.5">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              WhatsApp está desactivado a nivel general. Actívalo primero en
              <strong> Configuración → General → Integraciones</strong>.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
        <header className="mb-5">
          <h2 className="text-base font-semibold">Resumen diario</h2>
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            Hora en la que recibes cada mañana un email con tus citas del día.
            La hora actual fija en producción es 8:00 (CDMX). Cambiar este valor
            requiere también ajustar <code>vercel.json</code>.
          </p>
        </header>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Hora del resumen</span>
          <span className="inline-flex items-center gap-2">
            <input
              type="number"
              name="daily_summary_hour"
              defaultValue={s.daily_summary_hour}
              min={0}
              max={23}
              className="w-20 px-3 py-2 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm text-right tabular-nums"
            />
            <span className="text-xs text-[color:var(--color-brand-muted)]">
              :00 (CDMX)
            </span>
          </span>
        </label>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Guardar notificaciones
        </Button>
      </div>
    </form>
  );
}

function ToggleCell({
  name,
  checked,
  disabled,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex items-center cursor-pointer ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full bg-[color:var(--color-brand-ink)]/15 transition-colors peer-checked:bg-[color:var(--color-brand-green)] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        aria-hidden
      />
    </label>
  );
}
