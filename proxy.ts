import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const LOCALES = routing.locales;
const ADMIN_RE = new RegExp(`^/(${LOCALES.join("|")})?/?admin(/|$)`);

function isAdminPath(pathname: string): boolean {
  return ADMIN_RE.test(pathname);
}

function isLoginPath(pathname: string): boolean {
  return /\/admin\/login\/?$/.test(pathname);
}

/** Detect locale prefix from path. */
function detectLocale(pathname: string): string {
  const seg = pathname.split("/")[1];
  if (seg && LOCALES.includes(seg as (typeof LOCALES)[number])) return seg;
  return routing.defaultLocale;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run intl routing first; it returns a response with locale headers/cookies set.
  const intlResponse = intlMiddleware(request);

  if (!isAdminPath(pathname)) {
    return intlResponse;
  }

  // For admin paths, check auth on top of the intl response.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          intlResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = detectLocale(pathname);
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  // Not logged in + trying to access protected admin route → redirect to login
  if (!user && !isLoginPath(pathname)) {
    const loginUrl = new URL(`${localePrefix}/admin/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in + on login page → bounce to dashboard
  if (user && isLoginPath(pathname)) {
    return NextResponse.redirect(new URL(`${localePrefix}/admin`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
