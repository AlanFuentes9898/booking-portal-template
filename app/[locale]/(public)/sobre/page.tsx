import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { getSettings } from "@/lib/settings";
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
    title: locale === "es" ? "Sobre mí" : "About me",
    description: localized.profession
      ? `${localized.name} — ${localized.profession}`
      : localized.name,
    path: "/sobre",
    locale,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  setRequestLocale(rawLocale);
  const t = await getTranslations("pages");
  const [settings, brand] = await Promise.all([getSettings(), getBrand()]);
  const bio = (locale === "en" ? settings.bio_en : settings.bio_es).trim();

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 items-start">
      <div>
        <h1 className="text-4xl sm:text-5xl">{t("aboutTitle")}</h1>
        <div className="mt-8 space-y-4 text-[color:var(--color-brand-ink)]/75 leading-relaxed whitespace-pre-wrap">
          {bio ? (
            <p>{bio}</p>
          ) : (
            <>
              <p>
                {locale === "es"
                  ? "Mi enfoque combina ciencia de la nutrición deportiva con un acompañamiento cercano y realista. No vendo dietas mágicas: construimos hábitos sostenibles que mejoren tu rendimiento."
                  : "My approach combines sports nutrition science with close, realistic coaching. No magic diets — we build sustainable habits that improve your performance."}
              </p>
              <p>
                {locale === "es"
                  ? "He trabajado con corredores, ciclistas, triatletas, crossfitters y deportistas amateur que quieren entrenar mejor y recuperarse más rápido."
                  : "I've worked with runners, cyclists, triathletes, crossfitters, and amateur athletes who want to train better and recover faster."}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden">
        <Image
          src="/professional/img-4.jpg"
          alt={brand.name}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 480px, 100vw"
        />
      </div>
    </section>
  );
}
