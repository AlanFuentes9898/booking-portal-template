import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { publicEnv } from "@/lib/env";
import { getBrand } from "@/lib/brand";
import "../globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** Build dynamic metadata from settings + env brand. */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
    title: {
      default: brand.professionEs
        ? `${brand.name} — ${brand.professionEs}`
        : brand.name,
      template: `%s · ${brand.shortName}`,
    },
    description:
      "Agenda tu consulta en línea. Atención profesional, presencial y virtual.",
    icons: { icon: "/favicon.ico" },
    formatDetection: { telephone: false },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a8c658",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

// Avoid unused import lint
void publicEnv;
