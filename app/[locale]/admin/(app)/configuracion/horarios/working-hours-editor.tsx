"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveWorkingHours } from "./actions";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export type WorkingHourRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export function WorkingHoursEditor({
  initial,
}: {
  initial: WorkingHourRow[];
}) {
  const [rows, setRows] = useState<WorkingHourRow[]>(
    initial.map((r) => ({
      day_of_week: r.day_of_week,
      // DB returns 'HH:MM:SS', form needs 'HH:MM'
      start_time: r.start_time.slice(0, 5),
      end_time: r.end_time.slice(0, 5),
    })),
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function add() {
    setRows((r) => [
      ...r,
      { day_of_week: 1, start_time: "09:00", end_time: "13:00" },
    ]);
  }

  function update(i: number, patch: Partial<WorkingHourRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function submit() {
    const fd = new FormData();
    rows.forEach((r, i) => {
      fd.set(`ranges[${i}][day_of_week]`, String(r.day_of_week));
      fd.set(`ranges[${i}][start_time]`, r.start_time);
      fd.set(`ranges[${i}][end_time]`, r.end_time);
    });
    startTransition(async () => {
      await saveWorkingHours(fd);
      setSavedAt(new Date());
    });
  }

  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold">Días y rangos de atención</h2>
        <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
          Define los bloques en los que aceptas citas. Puedes tener varios
          rangos en el mismo día (ej. mañana y tarde).
        </p>
      </header>

      <div className="space-y-2.5">
        {rows.length === 0 && (
          <p className="text-sm text-[color:var(--color-brand-muted)] py-4 text-center">
            Sin rangos definidos. Agrega uno para empezar.
          </p>
        )}
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 sm:gap-3 p-3 rounded-xl border border-[color:var(--color-brand-ink)]/10 bg-[color:var(--color-brand-green-soft)]/10"
          >
            <select
              value={row.day_of_week}
              onChange={(e) =>
                update(i, { day_of_week: Number(e.target.value) })
              }
              className="px-3 py-2 rounded-lg border border-[color:var(--color-brand-ink)]/15 bg-white text-sm focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30"
            >
              {DAYS.map((d, idx) => (
                <option key={idx} value={idx}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={row.start_time}
              onChange={(e) => update(i, { start_time: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[color:var(--color-brand-ink)]/15 bg-white text-sm tabular-nums focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30"
            />
            <span className="text-[color:var(--color-brand-muted)] text-sm">→</span>
            <input
              type="time"
              value={row.end_time}
              onChange={(e) => update(i, { end_time: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[color:var(--color-brand-ink)]/15 bg-white text-sm tabular-nums focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-pink)] hover:bg-[color:var(--color-brand-pink-soft)]/30 transition"
              aria-label="Eliminar rango"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={add}>
          <Plus size={15} /> Agregar rango
        </Button>
        <div className="flex items-center gap-3">
          {savedAt && !pending && (
            <span className="text-xs text-[color:var(--color-brand-green)] font-medium">
              ✓ Guardado
            </span>
          )}
          <Button type="button" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" size={14} />}
            Guardar horarios
          </Button>
        </div>
      </div>
    </section>
  );
}
