<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## This repo is a white-label template

**If the user is onboarding a new client to this template**, read [`CLIENT_ONBOARDING.md`](./CLIENT_ONBOARDING.md) — it's the end-to-end runbook (intake checklist, step-by-step personalization, deployment, common variations, QA).

**If the user is doing day-to-day development** on the existing instance, see [`README.md`](./README.md) for stack overview, structure, and dev commands.

## Quick architectural pointers (so you don't relearn)

- **Identity (brand name, profession, etc.) is resolved at runtime** via `lib/brand.ts` → `getBrand()`. Source-of-truth order: DB `settings` → env `NEXT_PUBLIC_BRAND_*` → hardcoded fallback. Never hardcode the client's name in components.
- **Timezone** is `publicEnv.NEXT_PUBLIC_TIMEZONE`, re-exported as `CLINIC_TZ` from `lib/time.ts`. Same applies to currency.
- **Settings** (admin-editable runtime config) live in a key-value table read via `lib/settings.ts` → `getSettings()`. Adding a new setting: extend `AppSettings` type + `DEFAULTS` constant + (optionally) admin tab.
- **Auth:** `lib/auth.ts` exports `getProfile()`, `requireProfile()`, `requireRole()`. Use these in Server Components/Actions for the admin area. The middleware `proxy.ts` redirects `/admin/*` to login when unauthenticated.
- **Slot computation** (`lib/availability.ts`) is a **pure function** with tests. Don't put DB access or `new Date()` inside it — pass them in.
- **Server Actions** for admin mutations. **Route handlers** (`/api/*`) for public-facing JSON endpoints and webhooks.
- **i18n** strings live in `messages/{es,en}.json`. Never hardcode user-facing copy in components.
- **The admin route group `(app)`** wraps everything in `/admin/*` EXCEPT `/admin/login`, which renders bare so we avoid auth-loop redirects.
- **Feature flags** for opt-in integrations (e.g. `NEXT_PUBLIC_FEATURE_WHATSAPP`). When `false`, the related admin UI is hidden AND the related Server Actions skip writing those settings (preserves prior values).
