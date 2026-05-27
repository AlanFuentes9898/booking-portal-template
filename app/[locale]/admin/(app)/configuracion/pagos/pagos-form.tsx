"use client";

import { useState } from "react";
import { Plus, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SettingsForm } from "@/components/admin/settings-form";
import { savePaymentsSettings } from "./actions";
import type { AppSettings } from "@/lib/settings";

export function PagosForm({ settings: s }: { settings: AppSettings }) {
  return (
    <SettingsForm
      action={savePaymentsSettings}
      successMessage="Configuración de pagos guardada"
      className="space-y-6"
    >
      {(state, pending) => (
        <>
          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <header className="mb-5 flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-green-soft)]/50 text-[color:var(--color-brand-ink)]/80">
                <Wallet size={16} />
              </span>
              <div>
                <h2 className="text-base font-semibold">Control de pagos</h2>
                <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
                  Activa esta opción para registrar el cobro de cada cita y
                  acceder al módulo financiero.
                </p>
              </div>
            </header>

            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <span className="text-sm">
                <span className="font-medium">Activar control de pagos</span>
                <span className="block text-xs text-[color:var(--color-brand-muted)] mt-0.5">
                  Mostrará el módulo "Finanzas" en el menú y los campos de pago
                  en cada cita.
                </span>
              </span>
              <input
                type="checkbox"
                name="payments_enabled"
                defaultChecked={s.payments_enabled}
                className="peer sr-only"
              />
              <span
                className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full bg-[color:var(--color-brand-ink)]/15 transition-colors peer-checked:bg-[color:var(--color-brand-green)] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                aria-hidden
              />
            </label>
          </section>

          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <header className="mb-5">
              <h2 className="text-base font-semibold">Moneda</h2>
              <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
                Código de 3 letras (ISO 4217) — por ejemplo MXN, USD, EUR.
              </p>
            </header>
            <Field
              label="Código de moneda"
              error={state.fieldErrors?.currency_code}
            >
              <input
                type="text"
                name="currency_code"
                defaultValue={s.currency_code}
                maxLength={3}
                placeholder="MXN"
                className="w-32 px-3 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm uppercase tracking-wider"
              />
            </Field>
          </section>

          <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
            <header className="mb-5">
              <h2 className="text-base font-semibold">Métodos de pago</h2>
              <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
                Lista de opciones que aparecerán al marcar una cita como
                pagada. Edítala para reflejar lo que aceptas (Efectivo,
                Transferencia, OXXO, PayPal, Mercado Pago, etc.).
              </p>
            </header>
            <PaymentMethodsEditor initial={s.payment_methods} />
          </section>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Guardando..." : "Guardar pagos"}
            </Button>
          </div>
        </>
      )}
    </SettingsForm>
  );
}

function PaymentMethodsEditor({ initial }: { initial: string[] }) {
  const [methods, setMethods] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  function addMethod() {
    const v = draft.trim();
    if (!v) return;
    if (methods.some((m) => m.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    setMethods([...methods, v]);
    setDraft("");
  }

  function removeAt(i: number) {
    setMethods(methods.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <input
        type="hidden"
        name="payment_methods"
        value={JSON.stringify(methods)}
      />
      {methods.length === 0 ? (
        <p className="text-xs text-[color:var(--color-brand-muted)] italic mb-3">
          Sin métodos configurados — agrega al menos uno abajo.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 mb-4">
          {methods.map((m, i) => (
            <li
              key={`${m}-${i}`}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-[color:var(--color-brand-green-soft)]/60 text-sm"
            >
              <span>{m}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-brand-ink)]/60 hover:bg-[color:var(--color-brand-ink)]/10 hover:text-[color:var(--color-brand-ink)]"
                aria-label={`Quitar ${m}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMethod();
            }
          }}
          placeholder="Añadir método (ej. PayPal)"
          maxLength={60}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={addMethod}>
          <Plus size={14} /> Añadir
        </Button>
      </div>
    </div>
  );
}
