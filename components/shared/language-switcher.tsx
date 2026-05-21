"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function setLocale(nextLocale: "es" | "en") {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-[color:var(--color-brand-ink)]/15 p-0.5 text-xs font-medium"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => setLocale("es")}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          locale === "es"
            ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)]"
            : "text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)]"
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          locale === "en"
            ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)]"
            : "text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
