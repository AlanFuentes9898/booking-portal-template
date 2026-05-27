import { publicEnv } from "@/lib/env";

export type PlanTier = "esencial" | "profesional" | "clinica";

/** Features that can be gated by plan. Add new ones here as they appear. */
export type PlanFeature = "payments" | "finance";

const FEATURES_BY_TIER: Record<PlanTier, PlanFeature[]> = {
  esencial: [],
  profesional: ["payments", "finance"],
  clinica: ["payments", "finance"],
};

const LABEL_BY_TIER: Record<PlanTier, string> = {
  esencial: "Esencial",
  profesional: "Profesional",
  clinica: "Clínica",
};

/** Human label for a feature — used in upgrade prompts. */
const FEATURE_LABEL: Record<PlanFeature, string> = {
  payments: "Control de pagos",
  finance: "Módulo financiero",
};

export type Plan = {
  tier: PlanTier;
  label: string;
  allows: (feature: PlanFeature) => boolean;
  /** Lowest tier that includes the given feature. */
  minTierFor: (feature: PlanFeature) => PlanTier | null;
};

export function getPlan(): Plan {
  const tier = publicEnv.NEXT_PUBLIC_PLAN_TIER;
  const enabled = new Set<PlanFeature>(FEATURES_BY_TIER[tier]);
  return {
    tier,
    label: LABEL_BY_TIER[tier],
    allows: (f) => enabled.has(f),
    minTierFor: (f) => {
      for (const t of ["esencial", "profesional", "clinica"] as PlanTier[]) {
        if (FEATURES_BY_TIER[t].includes(f)) return t;
      }
      return null;
    },
  };
}

export function planLabel(tier: PlanTier): string {
  return LABEL_BY_TIER[tier];
}

export function featureLabel(feature: PlanFeature): string {
  return FEATURE_LABEL[feature];
}

/** Tiers (in display order) that include a given feature. */
export function tiersWithFeature(feature: PlanFeature): PlanTier[] {
  return (["profesional", "clinica"] as PlanTier[]).filter((t) =>
    FEATURES_BY_TIER[t].includes(feature),
  );
}
