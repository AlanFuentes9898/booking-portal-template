import { updateAppointmentPayment } from "@/app/[locale]/admin/(app)/citas/[id]/actions";

export function MarkPaidButton({
  id,
  amount,
}: {
  id: string;
  amount: number;
}) {
  return (
    <form action={updateAppointmentPayment}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="payment_status" value="paid" />
      <input type="hidden" name="amount_paid" value={String(amount)} />
      <input type="hidden" name="payment_method" value="" />
      <input type="hidden" name="paid_at" value="" />
      <button
        type="submit"
        className="text-sm font-medium text-[color:var(--color-brand-ink)] hover:text-[color:var(--color-brand-green)] hover:underline"
      >
        Marcar pagada
      </button>
    </form>
  );
}
