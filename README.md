# Portal de Citas — White-label SaaS de agendado

Portal de agendado de citas en línea para profesionales independientes: nutriólogos, psicólogos, médicos generales, coaches, dentistas, etc. **Cada cliente = un deploy independiente** con su propia base de datos, dominio y branding.

## ✨ Qué incluye

- **Sitio público** con landing, servicios, sobre, contacto, FAQ y flujo de agendado de 5 pasos
- **Panel admin** con dashboard, vista calendario semana/mes, gestión de citas y pacientes, configuración granular, agendado manual de citas subsecuentes
- **Cuestionario** dinámico para pacientes nuevos (drag-and-drop builder)
- **Notificaciones** por email (Resend) — confirmación, recordatorio 24h, cancelación, resumen diario al admin
- **Multi-idioma** ES/EN con switch en runtime
- **Multi-vertical** vía seed SQL: nutrición, psicología, medicina general, coach, genérico
- **Toda la copy editable** desde admin (nombre del negocio, taglines, hero, bio, terminología "paciente/cliente/consultante")
- **Política de cancelación** y reglas de agendado configurables
- **Roles** owner / asistente con RBAC

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript estricto |
| Estilos | Tailwind v4 + componentes propios estilo shadcn |
| DB + Auth | Supabase (Postgres + Auth + RLS) |
| Forms | React Hook Form + Zod |
| Fechas | date-fns-tz |
| i18n | next-intl |
| Email | Resend + React Email |
| Drag-and-drop | @dnd-kit |
| Cron | Vercel Cron |
| Hosting | Vercel |
| Package manager | pnpm |

## 🚀 Deploy a producción para un nuevo cliente

Sigue estos pasos para tener un portal funcionando para un nuevo profesional.

### 1. Clonar el repo

```bash
git clone <este-repo> mi-clinica-nueva
cd mi-clinica-nueva
pnpm install
```

### 2. Crear proyecto en Supabase

1. Ve a https://supabase.com → New project (free tier sirve para empezar)
2. Apunta **URL**, **anon (publishable) key** y **service_role key** (Settings → API)
3. Ve al **SQL Editor** y corre **en este orden**:
   - `supabase/migrations/0001_init.sql` — schema base
   - `supabase/migrations/0002_profile_trigger.sql` — trigger para auto-crear profiles
   - `supabase/seeds/vertical-{nutrition|psychology|medical|coach|generic}.sql` — elige según el vertical del cliente
4. En **Authentication → Users → Add user** crea la cuenta del profesional con su email + contraseña, marca **Auto Confirm User**. El trigger lo registrará como `owner`.

### 3. Configurar `.env.local`

Copia `.env.example` a `.env.local` y rellena:

```bash
# Identidad (esto define al cliente)
NEXT_PUBLIC_APP_URL=https://miclinica.com
NEXT_PUBLIC_BRAND_NAME="Dr. Juan Pérez"
NEXT_PUBLIC_BRAND_SHORT_NAME="Dr. Pérez"
NEXT_PUBLIC_TIMEZONE=America/Mexico_City
NEXT_PUBLIC_CURRENCY_CODE=MXN
NEXT_PUBLIC_CURRENCY_LOCALE=es-MX
NEXT_PUBLIC_VERTICAL=medical

# Supabase (paso 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email — registra cuenta en resend.com (gratis hasta 3000/mes)
RESEND_API_KEY=re_...
EMAIL_FROM="Dr. Pérez <citas@miclinica.com>"
ADMIN_NOTIFICATION_EMAIL=doctor@miclinica.com

# Cron — genera con: openssl rand -hex 32
CRON_SECRET=...
```

### 4. Reemplazar fotos y logo

```
public/
├── brand/
│   └── recurso-1.png       ← Logo (40×40 mínimo, PNG con transparencia)
└── professional/
    ├── img-1.jpg           ← Hero principal del landing (vertical, 4:5)
    ├── img-3.jpg           ← About en landing (cuadrada)
    ├── img-4.jpg           ← Página /sobre (vertical, 4:5)
    └── img-5.jpg           ← /contacto (banner del consultorio)
```

Sustituye los archivos por las fotos del cliente. Mantén los mismos nombres para no tocar código.

### 5. Probar localmente

```bash
pnpm dev
```

Abre http://localhost:3000 — verás el sitio con la nueva identidad. Login en `http://localhost:3000/admin/login`.

### 6. Pulir la copy desde el admin

Entra a `/admin/configuracion/perfil` y ajusta:
- Tagline ES/EN
- Hero (eyebrow, título, subtítulo)
- Bio para `/sobre`
- Datos públicos (email, teléfono, dirección, redes sociales)
- Terminología (Paciente / Cliente / Consultante)

Luego revisa `/admin/configuracion/general` para reglas de agendado, y `/admin/configuracion/horarios` para los días/horas que atiende.

### 7. Deploy a Vercel

```bash
# Asegúrate que el build pasa:
pnpm build

# Deploy
vercel
```

En el dashboard de Vercel:
1. **Settings → Environment Variables** → pega todas las del `.env.local` (excluyendo `NEXT_PUBLIC_APP_URL`, que se autocompleta)
2. **Settings → Domains** → conecta el dominio del cliente
3. Verifica `vercel.json` — los crons (`/api/cron/reminders` y `/api/cron/daily-summary`) se activan automáticamente al desplegar

### 8. Verificar dominio en Resend

Mientras `EMAIL_FROM` sea `onboarding@resend.dev`, Resend **solo envía emails al correo con el que registraste la cuenta**. Para mandar al paciente real:

1. En resend.com → Domains → Add Domain → `miclinica.com`
2. Agrega los DNS records que te pida (SPF, DKIM)
3. Cuando verifique, cambia `EMAIL_FROM` a `"Dr. Pérez <citas@miclinica.com>"`

## 🛠️ Desarrollo local

```bash
pnpm dev          # Webpack dev (recomendado en Windows por bug Turbopack)
pnpm dev:turbo    # Turbopack dev (más rápido si no truena)
pnpm build        # Build producción
pnpm test         # Tests unitarios (Vitest)
pnpm lint         # ESLint
```

### Estructura

```
app/
├── [locale]/
│   ├── (public)/             # Sitio público
│   └── admin/(app)/          # Panel admin
├── api/
│   ├── availability/         # Slots disponibles públicos
│   ├── admin/availability/   # Admin (sin restricciones de tiempo)
│   ├── appointments/         # CRUD citas
│   └── cron/                 # Reminders + daily summary
components/
├── ui/                       # Button, Dialog
├── publica/                  # Header, Footer, Booking wizard
├── admin/                    # Sidebar, page header
└── shared/                   # Language switcher, social icons
emails/                       # React Email templates
lib/
├── brand.ts                  # ← Identidad runtime (settings + env)
├── env.ts                    # ← Validación Zod de env vars
├── settings.ts               # ← Reader del KV settings table
├── auth.ts                   # ← Guards de admin
├── availability.ts           # Lógica pura de slots (con tests)
├── appointments.ts           # createAppointment + admin variant
└── supabase/                 # Clientes server/client/admin
supabase/
├── migrations/               # 0001_init, 0002_profile_trigger
└── seeds/                    # Verticales (nutrition, psychology, ...)
```

### Cómo se resuelve la identidad ("brand")

`lib/brand.ts` → `getBrand()` combina:
1. **Settings** (DB, editable desde admin) — toma prioridad si no está vacío
2. **Env vars** (`NEXT_PUBLIC_BRAND_*`) — fallback deploy-time
3. **Hardcoded** "Mi Clínica" — fallback final

Esto permite editar la marca al vuelo sin redeploy, pero garantiza valores razonables incluso antes de que el admin entre la primera vez.

## 📦 Próximas integraciones (Fase 4)

- Google Calendar + Meet auto-link para citas virtuales
- WhatsApp Cloud API
- Stripe Checkout para cobrar al agendar

## 📝 Licencia

(definir según tu modelo de comercialización)
