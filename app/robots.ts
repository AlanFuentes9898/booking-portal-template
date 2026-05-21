import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin + API are private. Cita pages live under unique tokens so they
        // shouldn't be indexed either (and would 404 anyway if guessed).
        disallow: ["/admin", "/api", "/cita/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
