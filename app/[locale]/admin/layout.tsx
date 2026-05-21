import { setRequestLocale } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
};

/**
 * Bare admin layout — only sets the locale.
 * Authenticated routes live under (app)/ which has its own layout with sidebar + guard.
 * Login lives directly under /admin/login and gets only this minimal layout.
 */
export default async function AdminBaseLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}
