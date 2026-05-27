export type PaymentStatus = "unpaid" | "paid" | "refunded" | "not_applicable";

const LABELS: Record<PaymentStatus, string> = {
  unpaid: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
  not_applicable: "No aplica",
};

const STYLES: Record<PaymentStatus, string> = {
  paid: "bg-[color:var(--color-brand-green-soft)]/70 text-[color:var(--color-brand-ink)] ring-1 ring-[color:var(--color-brand-green)]/40",
  unpaid:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-300/40",
  refunded:
    "bg-[color:var(--color-brand-pink-soft)]/40 text-[color:var(--color-brand-pink)] ring-1 ring-[color:var(--color-brand-pink)]/30",
  not_applicable:
    "bg-[color:var(--color-brand-ink)]/5 text-[color:var(--color-brand-ink)]/70 ring-1 ring-[color:var(--color-brand-ink)]/15",
};

const DOT: Record<PaymentStatus, string> = {
  paid: "bg-[color:var(--color-brand-green)]",
  unpaid: "bg-amber-500",
  refunded: "bg-[color:var(--color-brand-pink)]",
  not_applicable: "bg-[color:var(--color-brand-muted)]",
};

function asStatus(status: string): PaymentStatus {
  if (
    status === "paid" ||
    status === "unpaid" ||
    status === "refunded" ||
    status === "not_applicable"
  )
    return status;
  return "unpaid";
}

export function PaymentBadge({ status }: { status: string }) {
  const s = asStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[s]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[s]}`} />
      {LABELS[s]}
    </span>
  );
}

export function formatAmount(
  amount: number | null | undefined,
  currency: string,
): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString("es-MX")}`;
  }
}
