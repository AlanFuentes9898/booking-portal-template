import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./login-form";
import { publicEnv } from "@/lib/env";

type Props = { params: Promise<{ locale: string }> };

export const metadata = {
  title: "Admin",
};

// The login form reads `?next=...` via useSearchParams; opt out of static prerender.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "es") as "es" | "en";
  setRequestLocale(rawLocale);
  const brand = publicEnv.NEXT_PUBLIC_BRAND_SHORT_NAME;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--color-brand-green-soft)]/20 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <Image
            src="/brand/recurso-1.png"
            alt={brand}
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[color:var(--color-brand-ink)]">
              {brand}
            </p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
              {locale === "es" ? "Panel admin" : "Admin panel"}
            </p>
          </div>
        </Link>

        <div className="bg-white rounded-3xl border border-[color:var(--color-brand-ink)]/10 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">
            {locale === "es" ? "Iniciar sesión" : "Sign in"}
          </h1>
          <p className="mt-1.5 text-sm text-[color:var(--color-brand-muted)]">
            {locale === "es"
              ? "Acceso restringido al equipo."
              : "Staff access only."}
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <LoginForm locale={locale} />
            </Suspense>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--color-brand-muted)]">
          <Link href="/" className="hover:text-[color:var(--color-brand-ink)]">
            ← {locale === "es" ? "Volver al sitio" : "Back to site"}
          </Link>
        </p>
      </div>
    </main>
  );
}
