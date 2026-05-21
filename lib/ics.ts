import ical from "ical-generator";
import { publicEnv } from "@/lib/env";

export type IcsEventInput = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  /** Brand name to use as calendar/product name. Defaults to env brand. */
  brandName?: string;
};

export function buildIcsEvent(input: IcsEventInput): string {
  const brand = input.brandName?.trim() || publicEnv.NEXT_PUBLIC_BRAND_NAME;
  const cal = ical({
    name: brand,
    prodId: { company: brand, product: "appointments" },
    timezone: publicEnv.NEXT_PUBLIC_TIMEZONE,
  });
  cal.createEvent({
    id: input.uid,
    start: input.start,
    end: input.end,
    summary: input.summary,
    description: input.description ?? "",
    location: input.location ?? "",
    url: input.url,
  });
  return cal.toString();
}
