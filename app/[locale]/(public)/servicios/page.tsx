import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getActiveAppointmentTypes, getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { getBrand, localizeBrand } from "@/lib/brand";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<import("next").Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  const brand = await getBrand();
  const localized = localizeBrand(brand, locale);
  return pageMetadata({
    title: locale === "es" ? "Servicios" : "Services",
    description:
      locale === "es"
        ? `Tipos de consulta y servicios de ${localized.name}. Duración, modalidad y precios.`
        : `Consultation types and services of ${localized.name}. Duration, modality and pricing.`,
    path: "/servicios",
    locale,
  });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [services, settings] = await Promise.all([
    getActiveAppointmentTypes(),
    getSettings(),
  ]);
  const showPrices = settings.show_prices_publicly;

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl sm:text-5xl">{t("pages.servicesTitle")}</h1>
      <p className="mt-4 text-lg text-[color:var(--color-brand-ink)]/75 max-w-2xl">
        {t("pages.servicesIntro")}
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {services.map((s) => {
          const title = locale === "en" && s.name_en ? s.name_en : s.name_es;
          const description =
            locale === "en"
              ? s.description_en ?? s.description_es ?? ""
              : s.description_es ?? "";
          return (
            <article
              key={s.id}
              className="rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/5 p-8 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold">{title}</h2>
                {showPrices && s.price_mxn != null && (
                  <span className="text-lg font-semibold whitespace-nowrap">
                    ${s.price_mxn.toLocaleString("es-MX")} MXN
                  </span>
                )}
              </div>
              <p className="text-sm text-[color:var(--color-brand-muted)] mt-1">
                {s.duration_minutes} min
              </p>
              {description && (
                <p className="mt-4 text-[color:var(--color-brand-ink)]/80 flex-1">
                  {description}
                </p>
              )}
              <Button asChild className="mt-6 self-start">
                <Link href="/agendar">{t("common.cta")}</Link>
              </Button>
            </article>
          );
        })}

        {services.length === 0 && (
          <p className="text-[color:var(--color-brand-muted)]">
            {locale === "es"
              ? "Pronto publicaremos los servicios disponibles."
              : "Available services coming soon."}
          </p>
        )}
      </div>
    </section>
  );
}
