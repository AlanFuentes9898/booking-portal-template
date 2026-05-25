"use client";

import { useActionState, useEffect, useRef } from "react";
import type { RefObject } from "react";
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
 * Wraps useActionState for forms that live inside a Dialog. On success:
 * toast + closes the dialog + resets the form. On failure: toast with the
 * server-provided message and surfaces `state.fieldErrors` to consumers.
 */
export function useDialogAction(
  action: Action,
  {
    onOpenChange,
    formRef,
    successMessage = "Guardado",
    resetOnSuccess = true,
  }: {
    onOpenChange: (open: boolean) => void;
    formRef?: RefObject<HTMLFormElement | null>;
    successMessage?: string;
    resetOnSuccess?: boolean;
  },
) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(action, INITIAL_SETTINGS_STATE);
  const lastTs = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.ts || state.ts === lastTs.current) return;
    lastTs.current = state.ts;
    if (state.ok) {
      toast.success(state.message ?? successMessage);
      onOpenChange(false);
      if (resetOnSuccess) formRef?.current?.reset();
    } else {
      const fieldCount = state.fieldErrors
        ? Object.keys(state.fieldErrors).length
        : 0;
      toast.error(
        state.message ??
          (fieldCount
            ? `Revisa ${fieldCount} ${fieldCount === 1 ? "campo" : "campos"} con errores`
            : "No se pudo completar la acción"),
      );
    }
  }, [state, onOpenChange, formRef, successMessage, resetOnSuccess]);

  return { state, formAction, pending };
}
