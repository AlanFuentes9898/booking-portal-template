import { getSettings } from "@/lib/settings";
import { PerfilForm } from "./perfil-form";

export const dynamic = "force-dynamic";

export default async function PerfilPublicoPage() {
  const s = await getSettings();
  return <PerfilForm settings={s} />;
}
