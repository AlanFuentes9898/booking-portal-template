import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/publica/site-header";
import { SiteFooter } from "@/components/publica/site-footer";
import { getSettings } from "@/lib/settings";
import { getBrand, localizeBrand } from "@/lib/brand";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  setRequestLocale(rawLocale);
  const [settings, brand] = await Promise.all([getSettings(), getBrand()]);
  const localized = localizeBrand(brand, locale);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[color:var(--color-brand-green)] focus:text-[color:var(--color-brand-ink)] focus:px-4 focus:py-2 focus:rounded-xl focus:font-medium focus:shadow-md"
      >
        Saltar al contenido
      </a>
      <SiteHeader
        brand={{
          name: localized.name,
          shortName: localized.shortName,
          profession: localized.profession,
        }}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter
        settings={{
          brandName: localized.name,
          tagline:
            locale === "en"
              ? settings.brand_tagline_en
              : settings.brand_tagline_es,
          instagramUrl: settings.social_instagram_url,
          instagramHandle: settings.social_instagram_handle,
          facebookUrl: settings.social_facebook_url,
        }}
      />
    </>
  );
}
