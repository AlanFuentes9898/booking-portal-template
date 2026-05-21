import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { InstagramIcon, FacebookIcon } from "@/components/shared/social-icons";

type FooterSettings = {
  tagline?: string;
  instagramUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  brandName: string;
};

export function SiteFooter({ settings }: { settings: FooterSettings }) {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const brand = settings.brandName;
  const tagline = settings?.tagline?.trim() || t("footer.tagline");
  const igUrl = settings?.instagramUrl?.trim() || "";
  const igHandleRaw = settings?.instagramHandle?.trim() || "";
  const igHandleDisplay = igHandleRaw
    ? igHandleRaw.startsWith("@")
      ? igHandleRaw
      : `@${igHandleRaw}`
    : "";
  const fbUrl = settings?.facebookUrl?.trim() || "";

  return (
    <footer className="mt-24 border-t border-[color:var(--color-brand-ink)]/5 bg-[color:var(--color-brand-green-soft)]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-sm uppercase tracking-wider text-[color:var(--color-brand-muted)]">
            {brand}
          </p>
          <p className="mt-3 text-lg max-w-md text-[color:var(--color-brand-ink)]/90">
            {tagline}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--color-brand-ink)]">
            {t("nav.home")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-brand-ink)]/80">
            <li>
              <Link href="/servicios">{t("nav.services")}</Link>
            </li>
            <li>
              <Link href="/sobre">{t("nav.about")}</Link>
            </li>
            <li>
              <Link href="/faq">{t("nav.faq")}</Link>
            </li>
            <li>
              <Link href="/contacto">{t("nav.contact")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--color-brand-ink)]">
            {t("footer.follow")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            {igUrl && (
              <li>
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80 hover:text-[color:var(--color-brand-pink)]"
                >
                  <InstagramIcon className="size-4" /> {igHandleDisplay}
                </a>
              </li>
            )}
            {fbUrl && (
              <li>
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80 hover:text-[color:var(--color-brand-pink)]"
                >
                  <FacebookIcon className="size-4" /> Facebook
                </a>
              </li>
            )}
            <li>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 text-[color:var(--color-brand-ink)]/80 hover:text-[color:var(--color-brand-pink)]"
              >
                <Mail className="size-4" /> {t("footer.contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-brand-ink)]/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-xs text-[color:var(--color-brand-muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>
            © {year} {brand}. {t("footer.rights")}
          </p>
          <p>Hecho con cariño en México 🇲🇽</p>
        </div>
      </div>
    </footer>
  );
}
