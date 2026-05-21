import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { routing } from "@/i18n/routing";

/**
 * Sitemap with every public route × every locale.
 * Admin routes are excluded (they're behind auth anyway).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const paths = ["", "/servicios", "/sobre", "/contacto", "/faq", "/agendar"];
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    for (const locale of routing.locales) {
      const prefix =
        locale === routing.defaultLocale ? "" : `/${locale}`;
      entries.push({
        url: `${base}${prefix}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/agendar" ? 0.9 : 0.6,
      });
    }
  }
  return entries;
}
