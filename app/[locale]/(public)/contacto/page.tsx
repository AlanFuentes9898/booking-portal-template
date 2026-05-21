import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Mail, Phone, ArrowUpRight, Clock, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { InstagramIcon, FacebookIcon } from "@/components/shared/social-icons";
import { getSettings } from "@/lib/settings";
import { getBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<import("next").Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  const brand = await getBrand();
  return pageMetadata({
    title: locale === "es" ? "Contacto" : "Contact",
    description:
      locale === "es"
        ? `Datos de contacto de ${brand.name}: email, teléfono, redes sociales.`
        : `Contact info for ${brand.name}: email, phone, social media.`,
    path: "/contacto",
    locale,
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  setRequestLocale(rawLocale);
  const t = await getTranslations("pages");
  const [settings, brand] = await Promise.all([getSettings(), getBrand()]);
  const igHandleRaw = settings.social_instagram_handle.trim();
  const igHandleDisplay = igHandleRaw
    ? igHandleRaw.startsWith("@")
      ? igHandleRaw
      : `@${igHandleRaw}`
    : "";
  const publicEmail = settings.public_email.trim();
  const publicPhone = settings.public_phone.trim();
  const publicAddress = settings.public_address.trim();

  return (
    <div className="bg-[color:var(--color-brand-green-soft)]/15">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
          {/* LEFT: Hero copy + channels */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)]">
              {locale === "es" ? "Hablemos" : "Let's talk"}
            </p>
            <h1 className="hero-title mt-3 text-4xl sm:text-5xl text-[color:var(--color-brand-ink)]">
              {t("contactTitle")}
            </h1>
            <p className="mt-5 text-lg text-[color:var(--color-brand-ink)]/75 max-w-xl leading-relaxed">
              {t("contactBody")}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white border border-[color:var(--color-brand-ink)]/10 px-4 py-2 text-sm">
              <Clock
                size={14}
                className="text-[color:var(--color-brand-green)]"
              />
              <span className="text-[color:var(--color-brand-ink)]/75">
                {locale === "es"
                  ? "Respondemos en menos de 24 h"
                  : "We reply within 24 h"}
              </span>
            </div>

            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/agendar">
                  {locale === "es" ? "Agendar cita" : "Book appointment"}
                </Link>
              </Button>
            </div>
          </div>

          {/* RIGHT: Channel cards */}
          <div className="space-y-3">
            {settings.social_instagram_url && (
              <ChannelCard
                icon={<InstagramIcon className="size-5" />}
                label="Instagram"
                value={igHandleDisplay}
                href={settings.social_instagram_url}
                tone="pink"
              />
            )}
            {settings.social_facebook_url && (
              <ChannelCard
                icon={<FacebookIcon className="size-5" />}
                label="Facebook"
                value={brand.name}
                href={settings.social_facebook_url}
                tone="pink"
              />
            )}
            {publicEmail && (
              <ChannelCard
                icon={<Mail className="size-5" />}
                label="Email"
                value={publicEmail}
                href={`mailto:${publicEmail}`}
                tone="green"
              />
            )}
            <ChannelCard
              icon={<Phone className="size-5" />}
              label="WhatsApp"
              value={
                publicPhone || (locale === "es" ? "Por publicar" : "Coming soon")
              }
              href={
                publicPhone
                  ? `https://wa.me/${publicPhone.replace(/\D/g, "")}`
                  : undefined
              }
              tone="green"
              disabled={!publicPhone}
            />
            {publicAddress && (
              <ChannelCard
                icon={<MapPin className="size-5" />}
                label={locale === "es" ? "Consultorio" : "Clinic"}
                value={publicAddress}
                tone="green"
              />
            )}
          </div>
        </div>

        {/* Office / location strip (placeholder) */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2 items-center rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/10 overflow-hidden">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[260px]">
            <Image
              src="/professional/img-5.jpg"
              alt={brand.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          </div>
          <div className="p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-pink)]">
              {locale === "es" ? "Consultorio" : "Clinic"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {locale === "es"
                ? "Atención presencial y virtual"
                : "In-person and virtual sessions"}
            </h2>
            <p className="mt-3 text-[color:var(--color-brand-ink)]/75 leading-relaxed">
              {locale === "es"
                ? "Las consultas virtuales se realizan por Google Meet, con enlace incluido en tu confirmación. La modalidad presencial es en Ciudad de México — los detalles del consultorio se comparten al agendar."
                : "Virtual sessions happen on Google Meet, with the link in your confirmation. In-person sessions are in Mexico City — clinic details are shared upon booking."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChannelCard({
  icon,
  label,
  value,
  href,
  tone,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  tone: "green" | "pink";
  disabled?: boolean;
}) {
  const iconBg =
    tone === "pink"
      ? "bg-[color:var(--color-brand-pink-soft)]/40 text-[color:var(--color-brand-pink)]"
      : "bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)]";

  const inner = (
    <div
      className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all bg-white ${
        disabled
          ? "border-[color:var(--color-brand-ink)]/8 opacity-60"
          : "border-[color:var(--color-brand-ink)]/10 hover:border-[color:var(--color-brand-green)] hover:shadow-md"
      }`}
    >
      <span
        className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)] font-semibold">
          {label}
        </p>
        <p className="text-base font-medium text-[color:var(--color-brand-ink)] truncate">
          {value}
        </p>
      </div>
      {!disabled && href && (
        <ArrowUpRight
          size={18}
          className="text-[color:var(--color-brand-muted)] group-hover:text-[color:var(--color-brand-ink)] transition-colors flex-shrink-0"
        />
      )}
    </div>
  );

  return href && !disabled ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
      className="block"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}
