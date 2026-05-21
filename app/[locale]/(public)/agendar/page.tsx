import { setRequestLocale } from "next-intl/server";
import {
  BookingWizard,
  type WizardAppointmentType,
  type WizardQuestion,
} from "@/components/publica/booking-wizard";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<import("next").Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  const brand = await getBrand();
  return pageMetadata({
    title: locale === "es" ? "Agendar cita" : "Book appointment",
    description:
      locale === "es"
        ? `Reserva tu cita con ${brand.name} en menos de un minuto. Presencial o virtual.`
        : `Book your appointment with ${brand.name} in under a minute. In-person or virtual.`,
    path: "/agendar",
    locale,
  });
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const [typesRes, questionsRes, settings] = await Promise.all([
    supabase
      .from("appointment_types")
      .select(
        "id,name_es,name_en,duration_minutes,price_mxn,is_for_new_patients,description_es,description_en,is_active,sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questionnaire_questions")
      .select(
        "id,question_es,question_en,field_type,options,is_required,sort_order,is_active",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    getSettings(),
  ]);

  const types: WizardAppointmentType[] = (typesRes.data ?? []) as WizardAppointmentType[];
  const questions: WizardQuestion[] = (questionsRes.data ?? []) as WizardQuestion[];
  const policy =
    locale === "es"
      ? settings.cancellation_policy_es
      : settings.cancellation_policy_en;

  return (
    <div className="bg-[color:var(--color-brand-green-soft)]/15">
      <BookingWizard
        types={types}
        questions={questions}
        showPrices={settings.show_prices_publicly}
        cancellationPolicy={policy}
      />
    </div>
  );
}
