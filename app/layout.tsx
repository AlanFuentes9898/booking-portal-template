/**
 * Root layout. Required by Next.js when there's an app/not-found.tsx at the
 * root. The actual `<html>` and `<body>` live in `app/[locale]/layout.tsx`
 * (for the localized routes) and `app/not-found.tsx` (for the global 404).
 * This file is a pass-through so the framework's invariant is satisfied
 * without nesting <html> elements.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
