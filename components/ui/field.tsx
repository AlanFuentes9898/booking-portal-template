"use client";

import { useState, useId, cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode, ChangeEvent } from "react";
import { HelpCircle } from "lucide-react";

type InputLike = HTMLInputElement | HTMLTextAreaElement;

export type FieldProps = {
  /** Label displayed above the input */
  label: string;
  /** Optional help text shown via a tooltip on the "?" icon */
  help?: string;
  /** Max characters — enables the live counter */
  maxLength?: number;
  /** Initial value (for the counter on uncontrolled inputs) */
  defaultValue?: string;
  /** Error message from the Server Action — shown in red below the field */
  error?: string;
  /** The input/textarea element (its `id`, `name`, `defaultValue` should already be set) */
  children: ReactNode;
};

/**
 * Reusable form field wrapper with optional help-tooltip, live character
 * counter and inline error display. Designed to wrap an `<input>` or
 * `<textarea>` inside a Server Action `<form>`. Counter listens to `onChange`
 * locally so the input can stay uncontrolled (Server Actions read FormData).
 */
export function Field({
  label,
  help,
  maxLength,
  defaultValue,
  error,
  children,
}: FieldProps) {
  const reactId = useId();
  const childId =
    isValidElement(children) && typeof children.props === "object" && children.props && "id" in children.props
      ? (children.props as { id?: string }).id ?? reactId
      : reactId;

  const initial =
    defaultValue ??
    (isValidElement(children) && typeof children.props === "object" && children.props && "defaultValue" in children.props
      ? String((children.props as { defaultValue?: unknown }).defaultValue ?? "")
      : "");

  const [count, setCount] = useState(initial.length);

  // Inject onChange into the input child if maxLength is set so the counter updates live.
  const renderedChild = (() => {
    if (!isValidElement(children) || !maxLength) return children;
    const child = children as ReactElement<{
      id?: string;
      onChange?: (e: ChangeEvent<InputLike>) => void;
      "aria-invalid"?: boolean;
      "aria-describedby"?: string;
    }>;
    const prevOnChange = child.props.onChange;
    return cloneElement(child, {
      id: childId,
      "aria-invalid": Boolean(error) || undefined,
      "aria-describedby": error ? `${childId}-error` : undefined,
      onChange: (e: ChangeEvent<InputLike>) => {
        setCount(e.target.value.length);
        prevOnChange?.(e);
      },
    });
  })();

  const counterTone =
    maxLength === undefined
      ? "neutral"
      : count > maxLength
        ? "over"
        : count >= Math.floor(maxLength * 0.95)
          ? "warn"
          : count >= Math.floor(maxLength * 0.85)
            ? "soft"
            : "neutral";

  const counterClass =
    counterTone === "over"
      ? "text-[color:var(--color-brand-pink)] font-semibold"
      : counterTone === "warn"
        ? "text-[color:var(--color-brand-pink)]"
        : counterTone === "soft"
          ? "text-amber-600"
          : "text-[color:var(--color-brand-muted)]";

  return (
    <div className="block">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <label
          htmlFor={childId}
          className="block text-xs uppercase tracking-wider font-semibold text-[color:var(--color-brand-muted)]"
        >
          <span>{label}</span>
          {help && <HelpTooltip text={help} />}
        </label>
        {maxLength !== undefined && (
          <span
            className={`text-[10px] tabular-nums ${counterClass}`}
            aria-live="polite"
          >
            {count} / {maxLength}
          </span>
        )}
      </div>
      {renderedChild}
      {error && (
        <p
          id={`${childId}-error`}
          className="mt-1.5 text-xs text-[color:var(--color-brand-pink)] font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group align-middle ml-1.5">
      <button
        type="button"
        aria-label="Más información"
        title={text}
        className="inline-flex items-center justify-center text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-green)] transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-green)]/40 rounded-full"
      >
        <HelpCircle size={13} strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-lg bg-[color:var(--color-brand-ink)] px-3 py-2 text-[11px] font-normal normal-case tracking-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/** Two-column row helper, matches the prior inline `Grid2` pattern. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
