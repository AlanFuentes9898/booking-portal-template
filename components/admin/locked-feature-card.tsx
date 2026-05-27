import { Lock, Sparkles } from "lucide-react";
import {
  featureLabel,
  planLabel,
  tiersWithFeature,
  type PlanFeature,
  type PlanTier,
} from "@/lib/plan";

export function LockedFeatureCard({
  feature,
  currentTier,
}: {
  feature: PlanFeature;
  currentTier: PlanTier;
}) {
  const required = tiersWithFeature(feature);
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300/60 bg-amber-50/50 p-8 sm:p-10 text-center">
      <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Lock size={20} />
      </span>
      <h3 className="text-lg font-semibold text-[color:var(--color-brand-ink)]">
        Función no disponible en tu plan {planLabel(currentTier)}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--color-brand-ink)]/75 max-w-md mx-auto">
        <strong>{featureLabel(feature)}</strong>{" "}
        {required.length > 0 ? (
          <>
            está incluido en los planes{" "}
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {required.map((t, i) => (
                <span key={t}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[color:var(--color-brand-ink)] ring-1 ring-amber-300/60">
                    <Sparkles size={11} /> {planLabel(t)}
                  </span>
                  {i < required.length - 1 && " o "}
                </span>
              ))}
            </span>
            .
          </>
        ) : (
          "no está disponible en ningún plan en este momento."
        )}
      </p>
      <p className="mt-3 text-xs text-[color:var(--color-brand-muted)]">
        Contacta a tu proveedor del portal para actualizar tu plan.
      </p>
    </div>
  );
}

export function LockedInlineBanner({
  feature,
  currentTier,
}: {
  feature: PlanFeature;
  currentTier: PlanTier;
}) {
  const required = tiersWithFeature(feature);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4">
      <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Lock size={14} />
      </span>
      <div className="text-sm">
        <p className="font-semibold text-[color:var(--color-brand-ink)]">
          {featureLabel(feature)} no está disponible en tu plan{" "}
          {planLabel(currentTier)}
        </p>
        <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
          {required.length > 0
            ? `Disponible en ${required.map(planLabel).join(" y ")}. Contacta a tu proveedor para actualizar.`
            : "Contacta a tu proveedor para más información."}
        </p>
      </div>
    </div>
  );
}
