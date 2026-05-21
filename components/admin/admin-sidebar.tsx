"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { signOutAction } from "@/app/[locale]/admin/login/actions";
import { publicEnv } from "@/lib/env";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/admin/citas", label: "Citas", icon: ListChecks },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const brandShort = publicEnv.NEXT_PUBLIC_BRAND_SHORT_NAME;

  return (
    <>
      {/* Mobile topbar */}
      <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[color:var(--color-brand-ink)]/10 bg-white px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/brand/recurso-1.png"
            alt={brandShort}
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold">{brandShort} · Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[color:var(--color-brand-ink)]/10"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar — fixed on desktop, slide-over on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-[color:var(--color-brand-ink)]/10 transform transition-transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="hidden lg:flex h-[72px] items-center gap-2.5 px-6 border-b border-[color:var(--color-brand-ink)]/10"
          >
            <Image
              src="/brand/recurso-1.png"
              alt={brandShort}
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[color:var(--color-brand-ink)]">
                {brandShort}
              </p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Panel admin
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[color:var(--color-brand-green-soft)]/60 text-[color:var(--color-brand-ink)]"
                      : "text-[color:var(--color-brand-ink)]/70 hover:bg-[color:var(--color-brand-green-soft)]/30 hover:text-[color:var(--color-brand-ink)]"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User card */}
          <div className="p-4 border-t border-[color:var(--color-brand-ink)]/10">
            <UserMenu user={user} />
          </div>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-[color:var(--color-brand-ink)]/40"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

function UserMenu({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const [open, setOpen] = useState(false);
  const initial = user.name.charAt(0).toUpperCase();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[color:var(--color-brand-green-soft)]/30 transition-colors"
      >
        <span className="h-9 w-9 flex-shrink-0 rounded-full bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] text-sm font-semibold flex items-center justify-center">
          {initial}
        </span>
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm font-medium text-[color:var(--color-brand-ink)] truncate">
            {user.name}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)]">
            {user.role}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-[color:var(--color-brand-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/10 shadow-lg p-2">
          <p className="px-3 py-2 text-xs text-[color:var(--color-brand-muted)] break-all">
            {user.email}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[color:var(--color-brand-ink)] hover:bg-[color:var(--color-brand-pink-soft)]/30 transition-colors"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
