"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

type HeaderBrand = {
  name: string;
  shortName: string;
  profession: string;
};

const navLinks = [
  { href: "/", key: "home" as const },
  { href: "/servicios", key: "services" as const },
  { href: "/sobre", key: "about" as const },
  { href: "/faq", key: "faq" as const },
  { href: "/contacto", key: "contact" as const },
];

export function SiteHeader({ brand }: { brand: HeaderBrand }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[color:var(--color-brand-ink)]/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/recurso-1.png"
            alt={brand.shortName}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-[color:var(--color-brand-ink)]">
              {brand.shortName}
            </p>
            {brand.profession && (
              <p className="text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                {brand.profession}
              </p>
            )}
          </div>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => {
            const isActive =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.key}
                href={l.href}
                className={`px-3 py-2 text-sm rounded-full transition-colors ${
                  isActive
                    ? "text-[color:var(--color-brand-ink)] font-medium"
                    : "text-[color:var(--color-brand-ink)]/70 hover:text-[color:var(--color-brand-ink)]"
                }`}
              >
                {t(`nav.${l.key}`)}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Button asChild size="sm">
            <Link href="/agendar">{t("common.cta")}</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-brand-ink)]/10"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[color:var(--color-brand-ink)]/5 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
            {navLinks.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-base text-[color:var(--color-brand-ink)]/90"
              >
                {t(`nav.${l.key}`)}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-[color:var(--color-brand-ink)]/5">
              <LanguageSwitcher />
              <Button asChild size="sm" onClick={() => setOpen(false)}>
                <Link href="/agendar">{t("common.cta")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
