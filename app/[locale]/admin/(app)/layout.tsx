import { Toaster } from "sonner";
import { requireProfile } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getSettings } from "@/lib/settings";
import { getPlan } from "@/lib/plan";

/**
 * Authenticated admin layout — auth guard + sidebar.
 * Wraps everything under /admin EXCEPT /admin/login.
 */
export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, settings] = await Promise.all([
    requireProfile(),
    getSettings(),
  ]);
  const plan = getPlan();
  const roleLabel = profile.role === "owner" ? "Owner" : "Asistente";

  // Show Finanzas in the sidebar when:
  //   - plan unlocks it AND the client has enabled payments (normal case), OR
  //   - plan is locked (so the user always sees the upgrade hook).
  const showFinance = plan.allows("finance")
    ? settings.payments_enabled
    : true;
  const financeLocked = !plan.allows("finance");

  return (
    <div className="min-h-screen bg-[color:var(--color-brand-green-soft)]/10 lg:grid lg:grid-cols-[288px_1fr]">
      <AdminSidebar
        user={{
          name: profile.full_name,
          email: profile.email,
          role: roleLabel,
        }}
        showFinance={showFinance}
        financeLocked={financeLocked}
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
