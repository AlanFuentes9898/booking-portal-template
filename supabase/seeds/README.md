# Vertical seed templates

Each `*.sql` file in this folder is a **vertical preset** for a new deploy.

Run **one** of these after `0001_init.sql` to pre-populate appointment types,
questionnaire questions, and identity settings tuned to a specific industry.

> ⚠️ These are **destructive** to the seed data: they delete and re-insert the
> default `appointment_types` and `questionnaire_questions`. Run before any
> real bookings exist.

| Vertical | File | Identity defaults |
|---|---|---|
| Nutrición deportiva | `vertical-nutrition.sql` | "Primera consulta", "Seguimiento", "Antropometría" + 6 preguntas |
| Psicología clínica | `vertical-psychology.sql` | "Primera sesión", "Seguimiento" + cuestionario inicial breve |
| Médico general | `vertical-medical.sql` | "Consulta general", "Seguimiento" |
| Coach / Mentor | `vertical-coach.sql` | "Sesión inicial", "Sesión de seguimiento" |
| Genérico | `vertical-generic.sql` | "Consulta", "Seguimiento" — copy neutro |

## How to use

In the Supabase SQL editor (or via `psql`):

```sql
-- 1. Run the base migrations first (one time, on a fresh project):
--    supabase/migrations/0001_init.sql
--    supabase/migrations/0002_profile_trigger.sql

-- 2. Pick ONE vertical and run it:
\i seeds/vertical-psychology.sql
```

Then in the admin panel (`/admin/configuracion/perfil`) you can fine-tune
the brand name, hero copy, bio, etc.
