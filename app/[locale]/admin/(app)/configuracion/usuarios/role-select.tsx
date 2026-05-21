"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateUserRole } from "./actions";

export function RoleSelect({
  userId,
  initialRole,
  disabled,
}: {
  userId: string;
  initialRole: "owner" | "assistant";
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.currentTarget.value;
    const fd = new FormData();
    fd.set("id", userId);
    fd.set("role", role);
    startTransition(() => {
      updateUserRole(fd);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        defaultValue={initialRole}
        disabled={disabled || pending}
        onChange={onChange}
        className="px-3 py-1.5 rounded-lg border border-[color:var(--color-brand-ink)]/15 bg-white text-sm focus:border-[color:var(--color-brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/30 disabled:opacity-60"
      >
        <option value="assistant">Asistente</option>
        <option value="owner">Owner</option>
      </select>
      {pending && (
        <Loader2
          size={14}
          className="animate-spin text-[color:var(--color-brand-muted)]"
        />
      )}
    </span>
  );
}
