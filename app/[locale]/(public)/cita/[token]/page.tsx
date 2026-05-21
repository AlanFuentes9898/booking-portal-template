import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  UserRound,
  Mail,
  Phone,
  Download,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { formatTz } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CancelButton } from "@/components/publica/cancel-button";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export const dynamic = "force-dynamic";

export default async function AppointmentManagePage({ params }: Props) {
  const { locale: rawLocale, token } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  setRequestLocale(rawLocale);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id,start_time,end_time,modality,status,meet_link, patients ( full_name, email, phone ), appointment_types ( name_es, name_en, duration_minutes, price_mxn )",
    )
    .eq("cancellation_token", token)
    .maybeSingle();

  if (error || !data) notFound();

  const settings = await getSettings();
  const patient = Array.isArray(data.patients)
    ? data.patients[0]
    : data.patients;
  const type = Array.isArray(data.appointment_types)
    ? data.appointment_types[0]
    : data.appointment_types;

  const typeName =
    locale === "en" && type?.name_en ? type.name_en : type?.name_es ?? "";
  const formattedDate = formatTz(
    data.start_time,
    locale === "es" ? "EEEE d 'de' MMMM yyyy" : "EEEE, MMMM d, yyyy",
    locale,
  );
  const formattedTime = formatTz(data.start_time, "HH:mm");
  const policy =
    locale === "es"
      ? settings.cancellation_policy_es
      : settings.cancellation_policy_en;

  const hoursAhead =
    (new Date(data.start_time).getTime() - Date.now()) / 3600_000;
  const cancellable =
    data.status === "confirmed" &&
    hoursAhead >= settings.cancellation_hours_limit;

  return (
    <div className="bg-[color:var(--color-brand-green-soft)]/15">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)]">
            {locale === "es" ? "Tu cita" : "Your appointment"}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-[color:var(--color-brand-ink)]">
            {typeName}
          </h1>
          <div className="mt-4 flex justify-center">
            <StatusBadge status={data.status} locale={locale} />
          </div>
        </div>

        {/* Detail card */}
        <div className="mt-10 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/10 p-6 sm:p-8 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailRow
              icon={<CalendarDays size={16} />}
              label={locale === "es" ? "Fecha" : "Date"}
              value={<span className="capitalize">{formattedDate}</span>}
            />
            <DetailRow
              icon={<Clock size={16} />}
              label={locale === "es" ? "Hora" : "Time"}
              value={`${formattedTime} (CDMX) · ${type?.duration_minutes ?? 0} min`}
            />
            <DetailRow
              icon={
                data.modality === "virtual" ? (
                  <Video size={16} />
                ) : (
                  <MapPin size={16} />
                )
              }
              label={locale === "es" ? "Modalidad" : "Modality"}
              value={
                data.modality === "in_person"
                  ? locale === "es"
                    ? "Presencial"
                    : "In person"
                  : locale === "es"
                    ? "Virtual (Google Meet)"
                    : "Virtual (Google Meet)"
              }
            />
            {patient && (
              <DetailRow
                icon={<UserRound size={16} />}
                label={locale === "es" ? "Paciente" : "Patient"}
                value={patient.full_name}
              />
            )}
            {patient && (
              <DetailRow
                icon={<Mail size={16} />}
                label="Email"
                value={
                  <span className="break-all">{patient.email}</span>
                }
              />
            )}
            {patient && (
              <DetailRow
                icon={<Phone size={16} />}
                label={locale === "es" ? "Teléfono" : "Phone"}
                value={patient.phone}
              />
            )}
          </div>

          {data.meet_link && (
            <div className="mt-6 pt-6 border-t border-dashed border-[color:var(--color-brand-ink)]/10">
              <DetailRow
                icon={<LinkIcon size={16} />}
                label={locale === "es" ? "Enlace Meet" : "Meet link"}
                value={
                  <a
                    href={data.meet_link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[color:var(--color-brand-pink)] underline break-all"
                  >
                    {data.meet_link}
                  </a>
                }
              />
            </div>
          )}
        </div>

        {/* Policy strip */}
        <div className="mt-5 rounded-2xl bg-[color:var(--color-brand-green-soft)]/40 p-4 flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-[color:var(--color-brand-ink)]/70 mt-0.5 flex-shrink-0"
          />
          <p className="text-xs text-[color:var(--color-brand-ink)]/75 leading-relaxed">
            {policy}
          </p>
        </div>

        {/* Actions */}
        {data.status === "confirmed" && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <a href={`/api/appointments/${token}/ics`}>
                <Download size={16} />{" "}
                {locale === "es" ? "Guardar en calendario" : "Save to calendar"}
              </a>
            </Button>
            {cancellable ? (
              <CancelButton token={token} locale={locale} />
            ) : (
              <Button variant="outline" disabled>
                {locale === "es"
                  ? "Ya no se puede cancelar online"
                  : "Online cancellation closed"}
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/contacto">
                {locale === "es" ? "Contacto" : "Contact"}
              </Link>
            </Button>
          </div>
        )}

        {data.status === "cancelled" && (
          <div className="mt-8 text-center">
            <p className="text-[color:var(--color-brand-muted)]">
              {locale === "es"
                ? "Esta cita fue cancelada. Puedes agendar una nueva cuando quieras."
                : "This appointment was cancelled. You can book a new one anytime."}
            </p>
            <Button asChild size="lg" className="mt-5">
              <Link href="/agendar">
                {locale === "es" ? "Agendar nueva cita" : "Book new appointment"}
              </Link>
            </Button>
          </div>
        )}

        {data.status === "completed" && (
          <div className="mt-8 text-center">
            <p className="text-[color:var(--color-brand-muted)]">
              {locale === "es"
                ? "¡Gracias por venir! Esperamos verte en tu siguiente sesión."
                : "Thanks for coming! See you in the next session."}
            </p>
            <Button asChild size="lg" className="mt-5">
              <Link href="/agendar">
                {locale === "es" ? "Agendar seguimiento" : "Book follow-up"}
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: "es" | "en";
}) {
  const LABELS: Record<string, { es: string; en: string }> = {
    confirmed: { es: "Confirmada", en: "Confirmed" },
    cancelled: { es: "Cancelada", en: "Cancelled" },
    completed: { es: "Completada", en: "Completed" },
    no_show: { es: "No asistió", en: "No show" },
  };
  const STYLES: Record<string, string> = {
    confirmed:
      "bg-[color:var(--color-brand-green-soft)] text-[color:var(--color-brand-ink)] ring-1 ring-[color:var(--color-brand-green)]/40",
    cancelled:
      "bg-[color:var(--color-brand-pink-soft)]/50 text-[color:var(--color-brand-pink)] ring-1 ring-[color:var(--color-brand-pink)]/30",
    completed:
      "bg-[color:var(--color-brand-ink)]/5 text-[color:var(--color-brand-ink)]/70 ring-1 ring-[color:var(--color-brand-ink)]/15",
    no_show:
      "bg-[color:var(--color-brand-ink)]/5 text-[color:var(--color-brand-ink)]/70 ring-1 ring-[color:var(--color-brand-ink)]/15",
  };
  const label = LABELS[status]?.[locale] ?? status;
  const dotColor =
    status === "confirmed"
      ? "bg-[color:var(--color-brand-green)]"
      : status === "cancelled"
        ? "bg-[color:var(--color-brand-pink)]"
        : "bg-[color:var(--color-brand-muted)]";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${STYLES[status] ?? STYLES.completed}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-green-soft)]/50 text-[color:var(--color-brand-ink)]/80 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold">
          {label}
        </p>
        <p className="text-[color:var(--color-brand-ink)] font-medium leading-snug mt-0.5 text-sm">
          {value}
        </p>
      </div>
    </div>
  );
}
