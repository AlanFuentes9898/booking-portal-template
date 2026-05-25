import { getSettings } from "@/lib/settings";
import { publicEnv } from "@/lib/env";
import { NotificacionesForm } from "./notificaciones-form";

export const dynamic = "force-dynamic";

export default async function NotificacionesPage() {
  const s = await getSettings();
  return (
    <NotificacionesForm
      settings={s}
      showWhatsApp={publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP}
    />
  );
}
