import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

/**
 * Validates the request is coming from a trusted cron source.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
 * the secret matches the env var. We also accept `?secret=` for manual tests
 * via browser/curl.
 */
export function assertCronAuth(req: NextRequest): NextResponse | null {
  const { CRON_SECRET } = serverEnv();
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const header = req.headers.get("authorization");
  const headerOk = header === `Bearer ${CRON_SECRET}`;
  const querySecret = req.nextUrl.searchParams.get("secret");
  const queryOk = querySecret === CRON_SECRET;
  if (!headerOk && !queryOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
