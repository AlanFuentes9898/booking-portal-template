import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  MessageCircle,
  HeartPulse,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getActiveAppointmentTypes, getSettings } from "@/lib/settings";
import { getBrand, localizeBrand, formatPrice } from "@/lib/brand";
import { pageMetadata, localBusinessJsonLd } from "@/lib/seo";
import { publicEnv } from "@/lib/env";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<import("next").Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  const brand = await getBrand();
  const localized = localizeBrand(brand, locale);
  const title = localized.profession
    ? `${localized.name} — ${localized.profession}`
    : localized.name;
  const description =
    locale === "es"
      ? `Agenda tu consulta en línea con ${localized.name}. Atención presencial y virtual, confirmación inmediata.`
      : `Book your appointment online with ${localized.name}. In-person and virtual sessions, instant confirmation.`;
  return pageMetadata({ title, description, path: "/", locale });
}

export default async function HomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  setRequestLocale(rawLocale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const [services, settings, brand] = await Promise.all([
    getActiveAppointmentTypes(),
    getSettings(),
    getBrand(),
  ]);
  const localized = localizeBrand(brand, locale);
  const heroEyebrow =
    (locale === "en" ? settings.hero_eyebrow_en : settings.hero_eyebrow_es) ||
    localized.profession ||
    t("heroEyebrow");
  const heroTitle =
    (locale === "en" ? settings.hero_title_en : settings.hero_title_es) ||
    t("heroTitle");
  const heroSubtitle =
    (locale === "en" ? settings.hero_subtitle_en : settings.hero_subtitle_es) ||
    t("heroSubtitle");
  const showPrices = settings.show_prices_publicly;

  const jsonLd = localBusinessJsonLd(brand, {
    phone: settings.public_phone || undefined,
    email: settings.public_email || undefined,
    address: settings.public_address || undefined,
    url: publicEnv.NEXT_PUBLIC_APP_URL,
  });

  return (
    <>
      <script
        type="application/ld+json"
        // Static, server-rendered string — safe to inject.
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      {/* HERO */}
      <section className="relative overflow-hidden bg-[color:var(--color-brand-green-soft)]/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)]">
              {heroEyebrow}
            </p>
            <h1 className="hero-title mt-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-[color:var(--color-brand-ink)]">
              {heroTitle}
            </h1>
            <p className="mt-6 text-lg text-[color:var(--color-brand-ink)]/75 max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/agendar">
                  {tc("cta")} <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/servicios">{tc("ctaSecondary")}</Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[color:var(--color-brand-muted)]">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand-green)]" />
                {locale === "es" ? "Pacientes nuevos bienvenidos" : "New patients welcome"}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand-green)]" />
                {locale === "es" ? "Presencial y virtual" : "In-person and virtual"}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand-green)]" />
                {locale === "es" ? "Confirmación inmediata" : "Instant confirmation"}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-xl shadow-[color:var(--color-brand-ink)]/10">
              <Image
                src="/professional/img-1.jpg"
                alt={localized.name}
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
              />
            </div>
            {/* Floating accent — only shown when profession is set */}
            {localized.profession && (
              <div className="absolute -bottom-5 -left-5 hidden sm:block rounded-2xl bg-white px-5 py-4 shadow-lg shadow-[color:var(--color-brand-ink)]/10 border border-[color:var(--color-brand-ink)]/5">
                <p className="text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                  {locale === "es" ? "Especialidad" : "Specialty"}
                </p>
                <p className="text-sm font-semibold mt-0.5">
                  {localized.profession}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT — compact band */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-8 items-center">
          <div className="relative aspect-square rounded-full overflow-hidden mx-auto sm:mx-0 w-40 sm:w-full">
            <Image
              src="/professional/img-3.jpg"
              alt={localized.name}
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)] font-semibold">
              {locale === "es" ? "Sobre mí" : "About me"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold mt-2">
              {t("aboutTitle")}
            </h2>
            <p className="mt-4 text-[color:var(--color-brand-ink)]/75 leading-relaxed whitespace-pre-wrap">
              {(locale === "en"
                ? settings.bio_en
                : settings.bio_es
              ).trim() || t("aboutBody")}
            </p>
            <Link
              href="/sobre"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-brand-pink)] hover:underline"
            >
              {tc("ctaSecondary")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="servicios"
        className="py-16 lg:py-20 bg-[color:var(--color-brand-green-soft)]/25"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)] font-semibold">
              {locale === "es" ? "Nuestros servicios" : "Our services"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-2">
              {t("servicesTitle")}
            </h2>
            <p className="mt-3 text-[color:var(--color-brand-ink)]/70">
              {t("servicesSubtitle")}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {services.map((s, i) => {
              const title =
                locale === "en" && s.name_en ? s.name_en : s.name_es;
              const description =
                locale === "en"
                  ? s.description_en ?? s.description_es ?? ""
                  : s.description_es ?? "";
              return (
                <ServiceCard
                  key={s.id}
                  icon={
                    i === 0 ? (
                      <HeartPulse size={22} />
                    ) : (
                      <CalendarCheck size={22} />
                    )
                  }
                  title={title}
                  duration={s.duration_minutes}
                  description={description}
                  price={showPrices ? s.price_mxn : null}
                  locale={locale}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)] font-semibold">
              {locale === "es" ? "Proceso" : "Process"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-2">
              {t("howTitle")}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <HowStep
              n={1}
              icon={<CalendarCheck size={22} />}
              title={t("howStep1Title")}
              body={t("howStep1Body")}
            />
            <HowStep
              n={2}
              icon={<MessageCircle size={22} />}
              title={t("howStep2Title")}
              body={t("howStep2Body")}
            />
            <HowStep
              n={3}
              icon={<HeartPulse size={22} />}
              title={t("howStep3Title")}
              body={t("howStep3Body")}
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — horizontal strip */}
      <section className="py-16 lg:py-20 bg-[color:var(--color-brand-green-soft)]/25">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)] font-semibold">
              {locale === "es" ? "Testimonios" : "Testimonials"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-2">
              {t("testimonialsTitle")}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Testimonial
              quote={t("testimonial1")}
              author={t("testimonial1Author")}
            />
            <Testimonial
              quote={t("testimonial2")}
              author={t("testimonial2Author")}
            />
            <Testimonial
              quote={t("testimonial3")}
              author={t("testimonial3Author")}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)] font-semibold">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold mt-2">
              {t("faqTitle")}
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white p-5 sm:p-6 border border-[color:var(--color-brand-ink)]/10"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-[color:var(--color-brand-ink)]">
                  {t(`faq${i}Q` as "faq1Q")}
                  <span className="ml-4 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)] transition-transform group-open:rotate-45 text-lg">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[color:var(--color-brand-ink)]/75 leading-relaxed">
                  {t(`faq${i}A` as "faq1A")}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[color:var(--color-brand-ink)] text-white p-10 sm:p-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, var(--color-brand-green) 0, transparent 40%), radial-gradient(circle at 80% 70%, var(--color-brand-pink) 0, transparent 35%)",
              }}
            />
            <div className="relative">
              <h2 className="hero-title text-3xl sm:text-4xl text-white">
                {locale === "es"
                  ? "Lista, listo para tu próximo entrenamiento?"
                  : "Ready for your next training cycle?"}
              </h2>
              <p className="mt-4 text-white/75 max-w-xl mx-auto">
                {locale === "es"
                  ? "Agenda tu consulta en menos de un minuto."
                  : "Book your consultation in under a minute."}
              </p>
              <Button asChild size="lg" className="mt-7" variant="primary">
                <Link href="/agendar">
                  {tc("cta")} <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceCard({
  icon,
  title,
  duration,
  description,
  price,
  locale,
}: {
  icon: React.ReactNode;
  title: string;
  duration: number;
  description: string;
  price: number | null;
  locale: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-7 border border-[color:var(--color-brand-ink)]/8 hover:border-[color:var(--color-brand-green)] hover:shadow-md transition-all flex flex-col">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)]">
        {icon}
      </div>
      <div className="mt-5 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {price != null && (
          <span className="text-base font-semibold whitespace-nowrap">
            {formatPrice(price)}
          </span>
        )}
      </div>
      <p className="text-sm text-[color:var(--color-brand-muted)] mt-1">
        {duration} min
      </p>
      <p className="mt-4 text-[color:var(--color-brand-ink)]/75 leading-relaxed flex-1">
        {description}
      </p>
      <Link
        href="/agendar"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-brand-pink)] hover:underline self-start"
      >
        {locale === "es" ? "Conoce más" : "Learn more"} <ArrowRight size={14} />
      </Link>
    </article>
  );
}

function HowStep({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] flex items-center justify-center shadow-md shadow-[color:var(--color-brand-green)]/30">
        {icon}
      </div>
      <p className="mt-4 text-xs uppercase tracking-wider text-[color:var(--color-brand-muted)] font-semibold">
        {String(n).padStart(2, "0")}
      </p>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--color-brand-ink)]/70 leading-relaxed max-w-xs mx-auto">
        {body}
      </p>
    </div>
  );
}

function Testimonial({ quote, author }: { quote: string; author: string }) {
  return (
    <figure className="rounded-3xl bg-white p-6 border border-[color:var(--color-brand-ink)]/8">
      <div className="flex gap-0.5 text-[color:var(--color-brand-pink)] text-sm">
        {"★★★★★".split("").map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
      <blockquote className="mt-3 text-[color:var(--color-brand-ink)]/85 text-sm leading-relaxed">
        “{quote}”
      </blockquote>
      <figcaption className="mt-4 text-xs font-medium text-[color:var(--color-brand-muted)]">
        — {author}
      </figcaption>
    </figure>
  );
}
