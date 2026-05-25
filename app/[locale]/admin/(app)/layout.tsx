import { Toaster } from "sonner";
import { requireProfile } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

/**
 * Authenticated admin layout — auth guard + sidebar.
 * Wraps everything under /admin EXCEPT /admin/login.
 */
export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const roleLabel = profile.role === "owner" ? "Owner" : "Asistente";

  return (
    <div className="min-h-screen bg-[color:var(--color-brand-green-soft)]/10 lg:grid lg:grid-cols-[288px_1fr]">
      <AdminSidebar
        user={{
          name: profile.full_name,
          email: profile.email,
          role: roleLabel,
        }}
      />
      <div className="min-w-0">{children}</div>
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: { fontFamily: "inherit" },
        }}
      />
    </div>
  );
}
