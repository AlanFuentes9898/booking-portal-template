import "server-only";
import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";
import { getBrand, type Brand } from "@/lib/brand";

/**
 * Build per-page metadata that inherits the brand's title template defined
 * in app/[locale]/layout.tsx (so titles render as "Page · Brand Short").
 *
 * `path` is the canonical pathname (e.g. "/servicios"). Locale prefix is
 * added automatically for non-default locales.
 */
export async function pageMetadata({
  title,
  description,
  path = "/",
  locale = "es",
  image,
}: {
  title: string;
  description: string;
  path?: string;
  locale?: "es" | "en";
  image?: string;
}): Promise<Metadata> {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const localePrefix = locale === "es" ? "" : `/${locale}`;
  const url = `${base}${localePrefix}${path === "/" ? "" : path}`;
  const ogImage = image ?? "/og.png";
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        es: `${base}${path === "/" ? "" : path}`,
        en: `${base}/en${path === "/" ? "" : path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      locale: locale === "en" ? "en_US" : "es_MX",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/** JSON-LD structured data for the practice's landing page. */
export function localBusinessJsonLd(
  brand: Brand,
  opts: { phone?: string; email?: string; address?: string; url: string },
): string {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand.name,
    url: opts.url,
  };
  if (brand.professionEs) data.description = brand.professionEs;
  if (opts.phone) data.telephone = opts.phone;
  if (opts.email) data.email = opts.email;
  if (opts.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: opts.address,
    };
  }
  return JSON.stringify(data);
}
