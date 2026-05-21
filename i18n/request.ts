import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { publicEnv } from "../lib/env";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: publicEnv.NEXT_PUBLIC_TIMEZONE,
  };
});
