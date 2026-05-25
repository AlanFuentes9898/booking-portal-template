"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  INITIAL_SETTINGS_STATE,
  type SettingsActionState,
} from "@/lib/admin-form-state";

type Action = (
  state: SettingsActionState,
  formData: FormData,
) => Promise<SettingsActionState> | SettingsActionState;

/**
 * Renders a <form> wired to a Server Action that returns SettingsActionState.
 * On every action response it shows a sonner toast (success or error) and
 * exposes `state.fieldErrors` to children via a render prop. Must be used from
 * a Client parent (the render-prop function can't cross the RSC boundary).
 */
export function SettingsForm({
  action,
  successMessage = "Cambios guardados",
  errorMessage,
  children,
  className,
}: {
  action: Action;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
  children: (state: SettingsActionState, pending: boolean) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(action, INITIAL_SETTINGS_STATE);

  const lastToastedTs = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.ts || state.ts === lastToastedTs.current) return;
    lastToastedTs.current = state.ts;
    if (state.ok) {
      toast.success(state.message ?? successMessage);
    } else {
      const fieldCount = state.fieldErrors
        ? Object.keys(state.fieldErrors).length
        : 0;
      toast.error(
        state.message ??
          errorMessage ??
          (fieldCount
            ? `Revisa ${fieldCount} ${fieldCount === 1 ? "campo" : "campos"} con errores`
            : "No se pudieron guardar los cambios"),
      );
    }
  }, [state, successMessage, errorMessage]);

  return (
    <form action={formAction} className={className}>
      {children(state, pending)}
    </form>
  );
}
