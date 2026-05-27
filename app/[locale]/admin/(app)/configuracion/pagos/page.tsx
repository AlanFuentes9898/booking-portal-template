import { getSettings } from "@/lib/settings";
import { getPlan } from "@/lib/plan";
import { LockedFeatureCard } from "@/components/admin/locked-feature-card";
import { PagosForm } from "./pagos-form";

export const dynamic = "force-dynamic";

export default async function PagosSettingsPage() {
  const plan = getPlan();
  if (!plan.allows("payments")) {
    return <LockedFeatureCard feature="payments" currentTier={plan.tier} />;
  }
  const s = await getSettings();
  return <PagosForm settings={s} />;
}
