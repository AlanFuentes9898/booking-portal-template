"use client";

import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
  { href: "/admin/configuracion/general", label: "General", ownerOnly: false },
  { href: "/admin/configuracion/horarios", label: "Horarios", ownerOnly: false },
  { href: "/admin/configuracion/tipos-cita", label: "Tipos de cita", ownerOnly: false },
  { href: "/admin/configuracion/bloqueos", label: "Bloqueos", ownerOnly: false },
  { href: "/admin/configuracion/cuestionario", label: "Cuestionario", ownerOnly: false },
  { href: "/admin/configuracion/perfil", label: "Perfil público", ownerOnly: false },
  { href: "/admin/configuracion/notificaciones", label: "Notificaciones", ownerOnly: false },
  { href: "/admin/configuracion/usuarios", label: "Usuarios", ownerOnly: true },
];

export function ConfigTabs({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const visible = TABS.filter((t) => !t.ownerOnly || isOwner);
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 mb-6">
      {visible.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href as never}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] shadow-sm"
                : "text-[color:var(--color-brand-ink)]/70 hover:bg-[color:var(--color-brand-green-soft)]/40"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
