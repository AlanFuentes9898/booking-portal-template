import { getSettings } from "@/lib/settings";
import { publicEnv } from "@/lib/env";
import { GeneralForm } from "./general-form";

export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage() {
  const s = await getSettings();
  return (
    <GeneralForm
      settings={s}
      showWhatsApp={publicEnv.NEXT_PUBLIC_FEATURE_WHATSAPP}
    />
  );
}
