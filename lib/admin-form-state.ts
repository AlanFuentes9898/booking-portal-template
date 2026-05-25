import type { ZodIssue } from "zod";

/**
 * Shape returned by every admin Server Action that powers a useActionState form.
 * The client wrapper turns this into a toast + inline `<Field error>` messages.
 */
export type SettingsActionState = {
  ok: boolean;
  message?: string;
  /** Map of field name → human-readable error. */
  fieldErrors?: Record<string, string>;
  /**
   * Set on every response so a client `useEffect` can detect distinct results
   * even when the user re-submits identical data.
   */
  ts?: number;
};

export const INITIAL_SETTINGS_STATE: SettingsActionState = { ok: false };

/** Turn a list of Zod issues into { fieldName: message } for inline display. */
export function zodIssuesToFieldErrors(
  issues: readonly ZodIssue[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = humanize(issue);
  }
  return out;
}

function humanize(issue: ZodIssue): string {
  // Prefer Zod's own message; fall back to a generic Spanish hint.
  if (issue.message && !/^Expected|^Required$/i.test(issue.message)) {
    return issue.message;
  }
  if (issue.code === "too_big") return "Excede el largo máximo permitido.";
  if (issue.code === "too_small") return "Valor demasiado corto.";
  if (issue.code === "invalid_type") return "Valor inválido.";
  return "Valor inválido.";
}
