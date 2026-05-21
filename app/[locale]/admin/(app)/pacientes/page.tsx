import { Search, Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { listPatients } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PacientesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const patients = await listPatients(sp.q);

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="Pacientes"
        description="Directorio completo. Busca por nombre, email o teléfono."
      />

      <form className="mb-6">
        <div className="relative max-w-md">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
          />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar..."
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
          />
        </div>
      </form>

      <div className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--color-brand-muted)]">
            {sp.q
              ? "No hay pacientes que coincidan."
              : "Aún no hay pacientes registrados."}
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-brand-ink)]/5">
            {patients.map((p) => {
              const initial = p.full_name.charAt(0).toUpperCase();
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/pacientes/${p.id}` as never}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[color:var(--color-brand-green-soft)]/10 transition"
                  >
                    <span className="h-11 w-11 flex-shrink-0 rounded-full bg-[color:var(--color-brand-green-soft)] text-[color:var(--color-brand-ink)] font-semibold flex items-center justify-center">
                      {initial}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[color:var(--color-brand-ink)] truncate">
                        {p.full_name}
                        {p.is_new && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-[color:var(--color-brand-pink)] bg-[color:var(--color-brand-pink-soft)]/40 px-2 py-0.5 rounded-full font-semibold">
                            Nuevo
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-xs text-[color:var(--color-brand-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Mail size={11} /> {p.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} /> {p.phone}
                        </span>
                        {p.sport && <span>· {p.sport}</span>}
                      </div>
                    </div>
                    <span className="text-[color:var(--color-brand-pink)] text-sm font-medium hidden sm:inline">
                      Ver →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-[color:var(--color-brand-muted)] text-right">
        {patients.length} {patients.length === 1 ? "paciente" : "pacientes"} (máx 200).
      </p>
    </main>
  );
}
