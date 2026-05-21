import { PageHeader } from "@/components/admin/page-header";
import { ConfigTabs } from "@/components/admin/config-tabs";
import { requireProfile } from "@/lib/auth";

export default async function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Configuración"
        description="Ajusta el comportamiento del portal, tus horarios y servicios."
      />
      <ConfigTabs isOwner={profile.role === "owner"} />
      {children}
    </main>
  );
}
