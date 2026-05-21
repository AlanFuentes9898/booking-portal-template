"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({ locale }: { locale: "es" | "en" }) {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin";
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="form-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="password">
          {locale === "es" ? "Contraseña" : "Password"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="form-input"
        />
      </div>

      {state.error && (
        <p className="text-sm text-[color:var(--color-brand-pink)] bg-[color:var(--color-brand-pink-soft)]/30 rounded-xl px-3 py-2.5">
          {locale === "es"
            ? "Email o contraseña incorrectos."
            : "Wrong email or password."}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending && <Loader2 className="animate-spin" size={16} />}
        {locale === "es" ? "Iniciar sesión" : "Sign in"}
      </Button>

      <style>{`
        .form-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid rgba(42,42,42,0.15);
          background: white;
          font-size: 15px;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .form-input:focus {
          border-color: var(--color-brand-green);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
        }
      `}</style>
    </form>
  );
}
