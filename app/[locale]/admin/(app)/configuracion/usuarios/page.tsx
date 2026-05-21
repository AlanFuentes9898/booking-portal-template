import { KeyRound, Trash2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { formatTz } from "@/lib/time";
import { InviteForm } from "./invite-form";
import { RoleSelect } from "./role-select";
import { deleteUser, sendPasswordReset } from "./actions";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: "owner" | "assistant";
  created_at: string;
};

export default async function UsuariosPage() {
  const me = await requireRole(["owner"]);
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,created_at")
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as ProfileRow[];
  const ownerCount = profiles.filter((p) => p.role === "owner").length;

  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold">Usuarios del panel</h2>
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            Solo los owners pueden ver y modificar esta sección.
          </p>
        </div>
        <InviteForm />
      </header>

      {profiles.length === 0 ? (
        <p className="text-sm text-[color:var(--color-brand-muted)] text-center py-8">
          Sin usuarios. (Esto no debería pasar.)
        </p>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--color-brand-muted)]">
                <th className="pb-3 font-semibold">Usuario</th>
                <th className="pb-3 font-semibold">Rol</th>
                <th className="pb-3 font-semibold">Desde</th>
                <th className="pb-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-brand-ink)]/5">
              {profiles.map((p) => {
                const isMe = p.id === me.id;
                const isLastOwner =
                  p.role === "owner" && ownerCount <= 1;
                return (
                  <tr key={p.id}>
                    <td className="py-4">
                      <p className="font-medium">
                        {p.full_name}
                        {isMe && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-[color:var(--color-brand-pink)] font-semibold">
                            tú
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[color:var(--color-brand-muted)]">
                        {p.email}
                      </p>
                    </td>
                    <td className="py-4">
                      <RoleSelect
                        userId={p.id}
                        initialRole={p.role}
                        disabled={isMe && isLastOwner}
                      />
                    </td>
                    <td className="py-4 text-xs text-[color:var(--color-brand-muted)]">
                      {formatTz(p.created_at, "d MMM yyyy", "es")}
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <form action={sendPasswordReset}>
                          <input
                            type="hidden"
                            name="email"
                            value={p.email}
                          />
                          <button
                            type="submit"
                            title="Enviar enlace para cambiar contraseña"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] hover:bg-[color:var(--color-brand-green-soft)]/40 transition"
                          >
                            <KeyRound size={14} />
                          </button>
                        </form>
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            disabled={isMe}
                            title={
                              isMe
                                ? "No puedes eliminarte a ti mismo"
                                : "Eliminar usuario"
                            }
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-pink)] hover:bg-[color:var(--color-brand-pink-soft)]/30 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[color:var(--color-brand-muted)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 text-xs text-[color:var(--color-brand-muted)]">
        <strong>Tip:</strong> Al crear un usuario nuevo, Supabase manda email
        de bienvenida si está configurado. El icono de llave envía un enlace
        de restablecimiento de contraseña.
      </p>
    </section>
  );
}
