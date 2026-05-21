"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X, UserPlus, Loader2, Check } from "lucide-react";
import { searchPatientsAction } from "./actions";

export type PatientLite = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  sport: string | null;
};

export type PatientPickerValue =
  | { kind: "existing"; patient: PatientLite }
  | {
      kind: "new";
      full_name: string;
      email: string;
      phone: string;
      sport: string;
    }
  | null;

export function PatientPicker({
  onChange,
  initialPatient,
}: {
  onChange: (v: PatientPickerValue) => void;
  initialPatient?: PatientLite | null;
}) {
  const [mode, setMode] = useState<"search" | "new" | "selected">(
    initialPatient ? "selected" : "search",
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientLite[]>([]);
  const [selected, setSelected] = useState<PatientLite | null>(
    initialPatient ?? null,
  );
  const [pending, startTransition] = useTransition();
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    email: "",
    phone: "",
    sport: "",
  });

  // Notify parent on mount if we have a prefilled patient
  useEffect(() => {
    if (initialPatient) {
      onChange({ kind: "existing", patient: initialPatient });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode !== "search") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await searchPatientsAction(query);
        setResults(r);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  function pickExisting(p: PatientLite) {
    setSelected(p);
    setMode("selected");
    onChange({ kind: "existing", patient: p });
  }

  function clear() {
    setSelected(null);
    setMode("search");
    setQuery("");
    setResults([]);
    onChange(null);
  }

  function updateNew(patch: Partial<typeof newPatient>) {
    const next = { ...newPatient, ...patch };
    setNewPatient(next);
    if (next.full_name && next.email && next.phone) {
      onChange({ kind: "new", ...next });
    } else {
      onChange(null);
    }
  }

  // === SELECTED state ===
  if (mode === "selected" && selected) {
    return (
      <div className="rounded-2xl border-2 border-[color:var(--color-brand-green)] bg-[color:var(--color-brand-green-soft)]/30 p-4 flex items-start gap-3">
        <span className="h-10 w-10 rounded-full bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] font-semibold flex items-center justify-center flex-shrink-0">
          {selected.full_name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{selected.full_name}</p>
          <p className="text-xs text-[color:var(--color-brand-muted)] truncate">
            {selected.email} · {selected.phone}
          </p>
          {selected.sport && (
            <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
              {selected.sport}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] hover:bg-white/50 transition"
          aria-label="Cambiar paciente"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // === NEW patient form ===
  if (mode === "new") {
    return (
      <div className="rounded-2xl border border-[color:var(--color-brand-ink)]/10 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium inline-flex items-center gap-2">
            <UserPlus size={15} /> Crear paciente nuevo
          </p>
          <button
            type="button"
            onClick={() => setMode("search")}
            className="text-xs text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)]"
          >
            ← Buscar existente
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            placeholder="Nombre completo *"
            value={newPatient.full_name}
            onChange={(e) => updateNew({ full_name: e.target.value })}
            className="form-input"
          />
          <input
            type="email"
            placeholder="Email *"
            value={newPatient.email}
            onChange={(e) => updateNew({ email: e.target.value })}
            className="form-input"
          />
          <input
            type="tel"
            placeholder="Teléfono / WhatsApp *"
            value={newPatient.phone}
            onChange={(e) => updateNew({ phone: e.target.value })}
            className="form-input"
          />
          <input
            placeholder="Deporte (opcional)"
            value={newPatient.sport}
            onChange={(e) => updateNew({ sport: e.target.value })}
            className="form-input"
          />
        </div>
        <style>{`
          .form-input {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid rgba(42,42,42,0.15);
            background: white;
            font-size: 14px;
            outline: none;
          }
          .form-input:focus {
            border-color: var(--color-brand-green);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
          }
        `}</style>
      </div>
    );
  }

  // === SEARCH mode ===
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
        />
        <input
          autoFocus
          placeholder="Buscar paciente por nombre, email o teléfono..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-3 rounded-xl border border-[color:var(--color-brand-ink)]/15 focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 text-sm bg-white"
        />
        {pending && (
          <Loader2
            size={14}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[color:var(--color-brand-muted)]"
          />
        )}
      </div>

      {query.length >= 2 && results.length > 0 && (
        <ul className="rounded-2xl border border-[color:var(--color-brand-ink)]/10 bg-white overflow-hidden divide-y divide-[color:var(--color-brand-ink)]/5">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pickExisting(p)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[color:var(--color-brand-green-soft)]/30 transition"
              >
                <span className="h-9 w-9 rounded-full bg-[color:var(--color-brand-green-soft)] text-[color:var(--color-brand-ink)] text-sm font-semibold flex items-center justify-center flex-shrink-0">
                  {p.full_name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.full_name}</p>
                  <p className="text-xs text-[color:var(--color-brand-muted)] truncate">
                    {p.email} · {p.phone}
                  </p>
                </div>
                <Check
                  size={14}
                  className="text-[color:var(--color-brand-muted)] opacity-0 hover:opacity-100"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 2 && !pending && results.length === 0 && (
        <p className="text-xs text-[color:var(--color-brand-muted)] px-2">
          Sin resultados. Crea un paciente nuevo →
        </p>
      )}

      <button
        type="button"
        onClick={() => setMode("new")}
        className="inline-flex items-center gap-2 text-sm text-[color:var(--color-brand-pink)] hover:underline px-2 mt-1"
      >
        <UserPlus size={14} /> Crear paciente nuevo
      </button>
    </div>
  );
}
