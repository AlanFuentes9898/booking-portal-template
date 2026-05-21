import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<import("next").Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  return pageMetadata({
    title: locale === "es" ? "Preguntas frecuentes" : "FAQ",
    description:
      locale === "es"
        ? "Respuestas a las dudas más comunes sobre el agendado y las consultas."
        : "Answers to common questions about booking and consultations.",
    path: "/faq",
    locale,
  });
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl sm:text-5xl text-center">
        {t("pages.faqPageTitle")}
      </h1>
      <div className="mt-10 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <details
            key={i}
            className="group rounded-2xl bg-white p-6 border border-[color:var(--color-brand-ink)]/10"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none font-medium">
              {t(`home.faq${i}Q` as "home.faq1Q")}
              <span className="ml-4 text-[color:var(--color-brand-pink)] transition-transform group-open:rotate-45 text-xl">
                +
              </span>
            </summary>
            <p className="mt-3 text-[color:var(--color-brand-ink)]/75">
              {t(`home.faq${i}A` as "home.faq1A")}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
