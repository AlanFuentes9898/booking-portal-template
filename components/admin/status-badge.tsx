type Status = "confirmed" | "cancelled" | "completed" | "no_show";

const LABELS: Record<Status, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

const STYLES: Record<Status, string> = {
  confirmed:
    "bg-[color:var(--color-brand-green-soft)]/70 text-[color:var(--color-brand-ink)] ring-1 ring-[color:var(--color-brand-green)]/40",
  cancelled:
    "bg-[color:var(--color-brand-pink-soft)]/40 text-[color:var(--color-brand-pink)] ring-1 ring-[color:var(--color-brand-pink)]/30",
  completed:
    "bg-[color:var(--color-brand-ink)]/5 text-[color:var(--color-brand-ink)]/80 ring-1 ring-[color:var(--color-brand-ink)]/15",
  no_show:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-300/40",
};

const DOT: Record<Status, string> = {
  confirmed: "bg-[color:var(--color-brand-green)]",
  cancelled: "bg-[color:var(--color-brand-pink)]",
  completed: "bg-[color:var(--color-brand-muted)]",
  no_show: "bg-amber-500",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {LABELS[status]}
    </span>
  );
}
