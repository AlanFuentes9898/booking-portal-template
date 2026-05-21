# Onboarding de cliente nuevo

> **Para Claude Code:** Lee este documento **completo** antes de empezar. Es tu runbook end-to-end para personalizar este template y entregárselo a un cliente nuevo. Pregunta a Alan los datos que falten antes de tocar código. Verifica con `pnpm build` y `pnpm dev` después de cada bloque de cambios.
>
> **Para Alan (humano):** Cuando recibas un cliente nuevo, clona el repo template, abre Claude Code apuntando a esa carpeta, y dile algo como _"sigue CLIENT_ONBOARDING.md para personalizar este portal para mi cliente nuevo"_. Claude te va a preguntar todo lo necesario.

---

## 0. Qué es este template

Portal full-stack de **agendado de citas para profesionales independientes** (nutriólogos, psicólogos, médicos, coaches, etc.). Single-tenant por diseño: cada cliente = una clonación del repo + su propia base de datos Supabase + su propio Vercel + su propio dominio.

Las **decisiones arquitectónicas clave** ya tomadas:
- Stack: Next.js 16 (App Router) + TypeScript estricto + Tailwind v4 + Supabase + Resend
- Identidad runtime: env vars (`NEXT_PUBLIC_BRAND_*`) + tabla `settings` (admin-editable)
- 5 plantillas de vertical (nutrición, psicología, medicina general, coach, genérico) en `supabase/seeds/`
- Multi-idioma ES/EN, multi-zona horaria, multi-moneda
- Email automation (Resend) ya cableado; WhatsApp/Stripe/Google Calendar quedaron como stubs con feature flags
- Auth Supabase con RBAC (owner / assistant)
- Tests Vitest (9 unitarios sobre `lib/availability.ts`)

**Lee `README.md`** si necesitas más detalle del stack.

---

## 1. Datos a recolectar del cliente (intake)

Antes de empezar, recolecta esta info. Si Alan no la tiene toda, **pregúntale o pídeselo al cliente vía email**. Usa esta lista como template del mensaje que Alan le manda al cliente.

### 🧬 Identidad del negocio (**obligatorio**)
| Campo | Ejemplo | Notas |
|---|---|---|
| Nombre completo del negocio o profesional | `Dra. Ana Torres` | Aparece como título principal |
| Nombre corto | `Dra. Torres` | Header, sidebar, emails |
| Profesión / especialidad (ES) | `Nutrióloga clínica` | Eyebrow del hero, opcional |
| Profesión / especialidad (EN) | `Clinical nutritionist` | Si no tiene inglés, copia del ES |
| Vertical | `nutrition` | Una de: `nutrition`, `psychology`, `medical`, `dental`, `coach`, `generic` |

### 🌍 Operación (**obligatorio**)
| Campo | Ejemplo | Default si no especifica |
|---|---|---|
| Zona horaria (IANA) | `America/Mexico_City` | `America/Mexico_City` |
| Moneda | `MXN` | `MXN` |
| Locale de moneda | `es-MX` | `es-MX` |
| Idioma principal | `es` | `es` |
| ¿Habilitar inglés? | sí/no | sí |

### 🩺 Servicios (al menos 1)
Por cada tipo de consulta el cliente debe definir:
- Nombre (ES) y nombre (EN opcional)
- Descripción corta (ES/EN opcional)
- Duración en minutos (mín 5, máx 480)
- Precio en su moneda (puede ser null para "consultar")
- ¿Es para pacientes nuevos? (dispara el cuestionario)

> **Tip:** Si el vertical tiene seed, los servicios default suelen estar bien y el cliente solo ajusta precios. Confirma con Alan si quiere los defaults o lista custom.

### 🕐 Horarios de atención (**obligatorio**)
Lista de bloques por día. Ejemplo típico:
- Lun-Vie 09:00–14:00 y 16:00–19:00
- Sáb 10:00–13:00
- Dom cerrado

### 📜 Reglas de agendado
| Campo | Default |
|---|---|
| Buffer entre citas (min) | 10 |
| Anticipación mínima para agendar (horas) | 4 |
| Máximo días en el futuro | 60 |
| Horas mínimas para cancelar online | 12 |
| Texto política cancelación (ES/EN) | usa default del seed |
| ¿Mostrar precios públicamente? | sí |

### 📞 Contacto público
| Campo | Notas |
|---|---|
| Email público | Opcional, se muestra en `/contacto` |
| Teléfono / WhatsApp público | Opcional, genera link `wa.me/...` |
| Dirección consultorio | Solo si ofrece presencial |
| URL Instagram | Opcional |
| Handle Instagram (sin @) | Para mostrar como `@handle` |
| URL Facebook | Opcional |

### ✍️ Copy del sitio
| Campo | Notas |
|---|---|
| Tagline (ES/EN) | Frase del footer (~80 chars) |
| Hero eyebrow (ES/EN) | Pequeño label arriba del título (~30 chars) |
| Hero título (ES/EN) | Headline principal del landing (~80 chars) |
| Hero subtítulo (ES/EN) | Descripción del headline (~200 chars) |
| Bio extensa (ES/EN) | Para `/sobre`, ~3-4 párrafos |

> Si el cliente no da copy custom, usa el del vertical seed y luego pídele que lo ajuste desde `/admin/configuracion/perfil`.

### 📸 Imágenes (4 archivos JPG)
| Archivo destino | Uso | Aspecto |
|---|---|---|
| `public/professional/img-1.jpg` | Hero landing principal | 4:5 vertical |
| `public/professional/img-3.jpg` | "Sobre" en landing | cuadrada (1:1) |
| `public/professional/img-4.jpg` | Página `/sobre` | 4:5 vertical |
| `public/professional/img-5.jpg` | `/contacto` banner | 4:3 horizontal |
| `public/brand/recurso-1.png` | Logo (40×40 mínimo) | PNG con transparencia |

Si el cliente no tiene fotos pro:
- **Para personas:** sugiere sesión con un fotógrafo (~$3000-5000 MXN)
- **Para consultorios sin foto:** stock genérico de Unsplash con búsqueda del vertical
- **Logo:** si solo tiene nombre, generar uno temporal con [Looka](https://looka.com), Canva o iniciales

### 🎨 Identidad visual (**opcional**)
- ¿Mantener paleta default (verde `#a8c658` + rosa `#eb3f66`)? sí/no
- Si quiere distintos:
  - Color primario (botones, headings) — hex
  - Color acento (CTAs alternos, badges) — hex
  - Versiones soft (background tints) — auto-calculadas

### 🔐 Infraestructura
| Componente | Notas |
|---|---|
| Dominio final | Ej: `dratorres.com` — el cliente lo debe comprar antes (Namecheap, Google Domains) |
| Cuenta Supabase | Cuenta free está bien. Crear proyecto nuevo por cliente |
| Cuenta Resend | Free hasta 3,000 emails/mes. Verificar dominio del cliente para que mande desde su email |
| Email del admin para notificaciones operativas | Adónde llegan resumen diario, nuevas citas |

### ⚙️ Integraciones opcionales (default todas off)
- ¿WhatsApp automation? (default no — flag `NEXT_PUBLIC_FEATURE_WHATSAPP`)
- ¿Pagos en línea Stripe? (default no — feature stub)
- ¿Google Calendar / Meet auto-link? (default no — feature stub)

---

## 2. Decisión rápida: ¿qué seed de vertical?

| Vertical del cliente | Seed | Notas |
|---|---|---|
| Nutriólogo / dietista | `vertical-nutrition.sql` | 3 tipos + 6 preguntas con foco deportivo. Edita el seed antes de correr si NO es deportivo |
| Psicólogo / terapeuta | `vertical-psychology.sql` | Usa "Consultante" en vez de "Paciente", política cancelación 24h |
| Médico general / familiar | `vertical-medical.sql` | "Consulta general" + "Chequeo preventivo" |
| Coach / mentor (life/business/fitness) | `vertical-coach.sql` | "Sesión inicial gratis" + 1:1 pagada |
| Dentista, fisioterapeuta, veterinario, otro | `vertical-generic.sql` | Copy neutro, customiza todo desde admin |

Si el vertical del cliente no encaja bien con ninguno → usa `vertical-generic.sql` y customiza vía admin.

---

## 3. Pasos de personalización (orden estricto)

> Sigue los pasos **en orden**. Después de cada paso valida que funciona antes de avanzar.

### Paso 1: Clonar el template a un repo nuevo del cliente

```bash
cd ~/dev   # o donde Alan tenga sus proyectos
git clone <URL_DEL_TEMPLATE> <slug-del-cliente>
cd <slug-del-cliente>
rm -rf .git
git init
git add .
git commit -m "Initial commit from template"
```

Sugerencia de naming: `dratorres-portal`, `psicologa-ana-portal`, etc.

**Verifica:** `pnpm install` corre sin errores.

### Paso 2: Crear proyecto en Supabase del cliente

1. Pide a Alan/cliente que cree proyecto en https://supabase.com (free tier sirve para empezar)
2. Anota: **Project URL**, **anon (publishable) key**, **service_role key** (en Settings → API)
3. En el SQL Editor, corre **en este orden**:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_profile_trigger.sql`
   3. `supabase/seeds/vertical-<elegido>.sql`

**Verifica:** En el Table Editor, debe haber: `profiles` (vacía), `patients`, `appointments`, `appointment_types` (3 filas seed), `working_hours` (11 filas seed), `settings`, `questionnaire_questions` (filas seed).

### Paso 3: Configurar `.env.local`

Copia `.env.example` a `.env.local` y rellena con los datos del cliente:

```bash
cp .env.example .env.local
```

Variables clave a llenar (las demás opcionales):

```bash
# === Identidad ===
NEXT_PUBLIC_APP_URL=https://<dominio-final>.com   # provisional: http://localhost:3000 para dev
NEXT_PUBLIC_BRAND_NAME="<Nombre completo>"
NEXT_PUBLIC_BRAND_SHORT_NAME="<Nombre corto>"
NEXT_PUBLIC_TIMEZONE=<tz>                          # ej. America/Mexico_City
NEXT_PUBLIC_CURRENCY_CODE=<MXN|USD|EUR|...>
NEXT_PUBLIC_CURRENCY_LOCALE=<es-MX|en-US|...>
NEXT_PUBLIC_VERTICAL=<nutrition|psychology|medical|coach|generic>

# === Supabase (paso 2) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === Email ===
RESEND_API_KEY=re_...
# Antes de verificar dominio:
EMAIL_FROM="<Nombre corto> <onboarding@resend.dev>"
# Después de verificar dominio:
# EMAIL_FROM="<Nombre corto> <citas@<dominio>.com>"
ADMIN_NOTIFICATION_EMAIL=<email-del-profesional>

# === Cron ===
CRON_SECRET=<generar con: openssl rand -hex 32>
```

**Verifica:** `pnpm dev` arranca sin errores en `http://localhost:3000`.

### Paso 4: Crear el primer usuario admin

En Supabase Dashboard → **Authentication → Users → Add user → Create new user**:
- Email: el del profesional
- Password: temporal (a cambiar en primer login)
- ✅ Auto Confirm User

El trigger del paso 2.3.2 lo va a insertar en `profiles` con `role='owner'`.

**Verifica:** En SQL Editor: `select * from profiles;` debe devolver 1 fila con `role='owner'`.

### Paso 5: Reemplazar imágenes y logo

Pide al cliente sus 5 archivos. Reemplaza en el repo manteniendo los nombres exactos:

```
public/brand/recurso-1.png            ← Logo
public/professional/img-1.jpg         ← Hero (4:5 vertical)
public/professional/img-3.jpg         ← About card (cuadrada)
public/professional/img-4.jpg         ← /sobre (4:5 vertical)
public/professional/img-5.jpg         ← /contacto (4:3)
```

> Si solo te dan 1 foto: úsala en `img-1` y oculta secciones que requieren las otras (avísale al cliente que sin las otras el sitio se ve incompleto).

**Verifica:** Recarga `http://localhost:3000/` — las fotos nuevas se cargan.

### Paso 6: (Opcional) Cambiar paleta de colores

Si el cliente pidió colores distintos al verde/rosa default, edita `app/globals.css`:

```css
:root {
  --color-brand-green: #<TU_PRIMARIO>;
  --color-brand-green-soft: #<TU_PRIMARIO_SOFT>;
  --color-brand-pink: #<TU_ACENTO>;
  --color-brand-pink-soft: #<TU_ACENTO_SOFT>;
  /* mantén los neutros */
}
```

**Sugerencia para variantes soft:** misma hue, alpha 30-40% sobre blanco. O usa una herramienta como [tints.dev](https://www.tints.dev/) para generar la escala completa.

> Las variables se llaman "green" y "pink" por la marca original pero **son agnósticas al color real** — no las renombres a `--color-brand-primary` salvo que quieras renombrar referencias en ~30 archivos.

**Verifica:** Headers, botones, badges y FAQs muestran los colores nuevos.

### Paso 7: Customizar copy desde el admin

Login en `/admin/login` con la cuenta del paso 4. Luego:

1. **`/admin/configuracion/perfil`** (lo más importante)
   - Identidad: nombre, profesión ES/EN
   - Hero: eyebrow, título, subtítulo ES/EN
   - Terminología (solo si vertical lo requiere — psicología usa "Consultante")
   - Bio extensa para `/sobre`
   - Datos públicos: email, teléfono, dirección
   - URLs redes sociales

2. **`/admin/configuracion/general`**
   - Reglas de agendado (buffer, anticipación, máx días, cancelación)
   - Política de cancelación ES/EN (si el seed no la cubre)
   - Mostrar precios públicamente (default sí)

3. **`/admin/configuracion/horarios`**
   - Configura días + rangos según los horarios del cliente
   - Borra los seed defaults si no aplican

4. **`/admin/configuracion/tipos-cita`**
   - Ajusta precios reales
   - Edita nombres/descripciones si el seed no encaja exacto
   - Activa/desactiva los que no use

5. **`/admin/configuracion/cuestionario`** (solo si el cliente quiere modificar)
   - Arrastra para reordenar
   - Agrega/elimina preguntas según necesidad del vertical

**Verifica:** Refresca el sitio público — todos los cambios se reflejan.

### Paso 8: (Opcional) Personalizar mensajes ES/EN

Si el cliente pidió cambios al copy genérico de FAQs, testimonios placeholder, hero step "Cómo funciona" etc, edita:

```
messages/es.json
messages/en.json
```

**No toques** las keys; solo los valores. Mantén ambos idiomas en sync.

### Paso 9: Verificar build + tests

```bash
pnpm build        # debe pasar verde, 0 errores TS
pnpm test         # 9/9 verdes
```

Si falla algo, **arréglalo antes de avanzar**. NO deploy si build falla.

### Paso 10: QA local end-to-end

Levantar dev y probar manualmente:

- [ ] `/` carga, hero con datos del cliente, fotos correctas
- [ ] Toggle ES/EN funciona en todas las páginas
- [ ] `/servicios` lista los tipos de cita correctos con precios
- [ ] `/sobre` muestra la bio del cliente
- [ ] `/contacto` muestra los canales que sí tienen valor (los vacíos no se renderizan)
- [ ] `/agendar` flujo completo: paciente nuevo → cuestionario → email llega ✉️
- [ ] `/cita/[token]` permite cancelar dentro del límite
- [ ] `/admin/login` funciona con la cuenta del paso 4
- [ ] Dashboard muestra la cita recién creada
- [ ] `/admin/calendario` muestra el evento en el día correcto
- [ ] `/admin/citas/nueva` agenda manualmente sin problemas
- [ ] `/admin/configuracion/usuarios` solo es visible para owner (loguéate como assistant para verificar — opcional)
- [ ] 404: visitar `/algo-inexistente` muestra la página 404 con brand
- [ ] Sitemap accesible en `/sitemap.xml`
- [ ] `/robots.txt` accesible

Si algo falla → arréglalo, no marques el item.

### Paso 11: Deploy a Vercel

```bash
# Si no hay cuenta Vercel:
pnpm dlx vercel login

# Primer deploy del proyecto
pnpm dlx vercel
# Sigue prompts: linka con cuenta correcta, ✅ override settings = no
```

En el **dashboard de Vercel** (https://vercel.com/dashboard):

1. **Project → Settings → Environment Variables**
   - Pega **todas** las variables del `.env.local` (incluyendo las opcionales si tienen valor)
   - ❌ NO subas `NEXT_PUBLIC_APP_URL` con `http://localhost:3000` — usa el dominio final
   - Marca todas como "Production, Preview, Development"

2. **Project → Settings → Domains**
   - Agrega el dominio del cliente (`dratorres.com` + `www.dratorres.com`)
   - Vercel da los DNS records que el cliente debe configurar en su proveedor
   - Espera propagación (5 min - 24h)

3. **Project → Cron Jobs** (automático desde `vercel.json`)
   - Debe mostrar 2 crons: `/api/cron/reminders` (cada hora) + `/api/cron/daily-summary` (8am MX)
   - Vercel los autentica con `CRON_SECRET` automáticamente

```bash
# Promote a producción
pnpm dlx vercel --prod
```

**Verifica:** El sitio carga en el dominio final, no en `xxx.vercel.app`.

### Paso 12: Verificar dominio en Resend (post-deploy)

Mientras `EMAIL_FROM` use `onboarding@resend.dev`, Resend **solo envía emails al correo registrado en Resend**. Para mandar a pacientes reales:

1. Resend → Domains → Add Domain → `<dominio-del-cliente>.com`
2. Agrega los DNS records (SPF, DKIM, opcional DMARC) en el proveedor del cliente
3. Cuando Resend muestre ✅ verificado:
   - En Vercel → env vars → cambia `EMAIL_FROM` a `"<Nombre> <citas@<dominio>.com>"`
   - Redeploy

**Verifica:** Agendar cita con un email NO del owner — debe recibir el email de confirmación.

### Paso 13: Handoff al cliente

Manda mensaje al cliente con:

```
Hola <nombre>,

Tu portal está listo en https://<dominio>.com

🔐 Acceso al panel admin:
   URL:        https://<dominio>.com/admin/login
   Email:      <su email>
   Contraseña: <temporal> ← Por favor cámbiala desde el panel en tu primer acceso

📋 Lo que ya está configurado:
- Tu identidad de marca (nombre, profesión, taglines)
- Servicios y precios
- Horarios de atención
- Política de cancelación
- Cuestionario inicial para nuevos pacientes
- Emails automáticos: confirmación, recordatorio 24h antes, cancelación
- Resumen diario por email a las 8:00 AM con tus citas del día

🛠️ Cosas que puedes editar tú mismo desde Configuración:
- Bio, copy de la home, fotos (vía soporte)
- Servicios, precios, duraciones
- Horarios y bloqueos por vacaciones
- Política de cancelación
- Preguntas del cuestionario

📞 ¿Necesitas algo más? Escríbeme.

Un abrazo,
Alan
```

---

## 4. Variaciones comunes (situaciones que se repiten)

### "El cliente no es de México"
- Cambia `NEXT_PUBLIC_TIMEZONE` a su IANA (`Europe/Madrid`, `America/Argentina/Buenos_Aires`, etc.)
- Cambia `NEXT_PUBLIC_CURRENCY_CODE` + `NEXT_PUBLIC_CURRENCY_LOCALE`
- En `vercel.json` ajusta el cron de daily-summary: 8am de su zona en UTC
  - Calcular: si quiere 8am España (UTC+1 en invierno, UTC+2 verano) → cron `0 7 * * *` (invierno) — o mejor usa una hora fija UTC

### "El cliente quiere solo español, sin inglés"
- En `i18n/routing.ts` → `locales: ["es"]`
- Borrar `messages/en.json` (opcional)
- Borrar el toggle ES/EN del header (`components/shared/language-switcher.tsx` no se renderiza si solo hay un locale, verifica)

### "El cliente quiere personalizar más colores que solo green/pink"
- `app/globals.css` tiene los tokens
- Para una paleta totalmente nueva con escala completa, considera generar con [tints.dev](https://www.tints.dev/) y reemplazar todas las shades
- Mantén el contraste WCAG AA: usa [coolors.co contrast checker](https://coolors.co/contrast-checker)

### "El cliente tiene un asistente / recepcionista"
- Login como owner → `/admin/configuracion/usuarios` → Invitar usuario → rol `assistant`
- El asistente NO ve la tab "Usuarios" ni puede modificar settings críticos

### "El cliente quiere agendar para varios profesionales en el mismo portal"
- ❌ La plantilla **NO soporta multi-profesional** en un solo deploy. Es single-practitioner por diseño.
- **Opciones:**
  - Si son 2-3 profesionales con horarios diferenciables: hacer modelado custom (agregar `professional_id` a `appointments`, `working_hours`, `appointment_types`)
  - Si son colegas independientes que comparten consultorio: un deploy por profesional, posiblemente subdomains (`dr1.miconsultorio.com`, `dr2.miconsultorio.com`)
  - Si es una clínica grande: considera no usar esta plantilla, usar algo tipo Doctoralia/SimplePractice

### "El cliente quiere WhatsApp"
1. Setea `NEXT_PUBLIC_FEATURE_WHATSAPP=true` en Vercel env
2. Sigue el flujo Meta Business + Cloud API (varios días, ver notas en README)
3. Implementa `lib/whatsapp.ts` con `sendWhatsAppTemplate()` (no está en plantilla; ~2h de código)
4. Cableado en 3 puntos: `lib/appointments.ts` (booking/cancellation), `app/api/cron/reminders/route.ts`

### "El cliente quiere Stripe / cobrar al agendar"
1. Setea `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`
2. Activa `payments_enabled` en `/admin/configuracion/general`
3. Implementa el flow (no está en plantilla):
   - `app/api/payments/checkout/route.ts` para crear sesión Stripe
   - `app/api/webhooks/stripe/route.ts` para confirmar pago y actualizar `payment_status`
   - Modificar wizard step 5 para mostrar botón Stripe cuando `showStripe=true`

### "El cliente quiere link Google Meet auto-generado para citas virtuales"
1. Setup Google Cloud OAuth (~20 min):
   - Google Cloud Console → nuevo proyecto → OAuth credentials → tipo Web app
   - Scope: `https://www.googleapis.com/auth/calendar.events`
   - Obtener `client_id`, `client_secret`, intercambiar code por `refresh_token` (usa [OAuth playground](https://developers.google.com/oauthplayground))
2. Setea `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
3. Implementa `lib/google.ts` con `createMeetEvent()` (no está en plantilla)
4. Cableado en `lib/appointments.ts` → cuando `modality === 'virtual'`, llama `createMeetEvent` y guarda `meet_link` + `google_event_id`

### "El cliente no tiene fotos profesionales aún"
- Stock recomendado: [Unsplash](https://unsplash.com) → busca "doctor consultation", "therapist office", "nutritionist consultation"
- Avisa al cliente que esto es **temporal**, debe agendar sesión con fotógrafo en máx 2 semanas
- Para el logo: si no tiene, hacer monograma con iniciales en Figma + el color brand (15 min)

### "El cliente cambió de opinión sobre el vertical / quiere reseed"
**⚠️ Solo antes de que haya citas reales en producción.**
1. En Supabase SQL editor: `DELETE FROM appointments; DELETE FROM patients;` (cuidado!)
2. Re-corre el seed del nuevo vertical
3. Avísale a Claude Code que cambie `NEXT_PUBLIC_VERTICAL` env

---

## 5. Limitaciones conocidas del template

- **Single-practitioner:** ver "Variaciones" arriba
- **WhatsApp, Stripe, Google Meet:** stubs/feature flags, requieren implementación cuando se necesite
- **OG image:** estática (`public/og.png`); cada deploy debe reemplazarla con una propia
- **Notificaciones in-app realtime:** no incluidas (innecesario para single-practitioner con email)
- **Stripe Connect / pagos a múltiples cuentas:** no aplicable (single-practitioner)
- **Vista móvil del calendario admin:** funciona pero la vista mensual se ve apretada en <600px
- **Idiomas:** solo ES/EN. Para más, agregar a `i18n/routing.ts` + nuevo `messages/<locale>.json`

---

## 6. Checklist final para Claude Code

Antes de marcar el onboarding completo, verifica:

- [ ] **Build verde:** `pnpm build` sin errores ni warnings críticos
- [ ] **Tests verdes:** `pnpm test` muestra 9/9
- [ ] **No quedan strings del cliente anterior:** `grep -ri "<nombre cliente anterior>" app components lib messages emails` → 0 resultados
- [ ] **`.env.local` completo:** todas las vars obligatorias tienen valor
- [ ] **Supabase migrations corridas:** profiles, settings, appointment_types tienen rows
- [ ] **Primer admin creado y validado login**
- [ ] **Fotos del cliente reemplazadas en /public/**
- [ ] **Brand mostrado correctamente en:** header, footer, sitemap (con dominio nuevo), emails
- [ ] **QA E2E del paso 10 pasó completo**
- [ ] **Deploy en Vercel responde 200 en el dominio final**
- [ ] **Cron jobs visibles en Vercel dashboard**
- [ ] **Resend domain en verificación o ya verificado**
- [ ] **Mensaje de handoff redactado y listo para enviar al cliente**

---

## 7. Cosas que NO debes hacer

- ❌ Editar `app/[locale]/admin/` UI sin razón muy clara — el admin ya está diseñado y testeado
- ❌ Tocar `lib/availability.ts` — es lógica crítica con tests, modifícala solo si hay un bug real
- ❌ Cambiar el schema sin agregar una migration nueva (`supabase/migrations/0003_*.sql`)
- ❌ Hardcodear el nombre del cliente nuevo en código — siempre vía env o settings
- ❌ Hacer commits sin revisar los cambios primero
- ❌ Marcar tareas como completas sin verificar (build + dev + smoke)
- ❌ Borrar `.env.local` del cliente original sin backup
- ❌ Confiar en que "esto compila → esto funciona" — siempre hacer al menos 1 smoke test manual end-to-end

---

## 8. Recursos rápidos

- **Stack docs:** Next.js 16, Tailwind v4, Supabase, Resend, date-fns-tz, next-intl
- **Decisiones técnicas:** ver `README.md`
- **Schema completo:** `supabase/migrations/0001_init.sql`
- **Identidad de marca:** `lib/brand.ts` + `lib/settings.ts`
- **Disponibilidad de slots:** `lib/availability.ts` (función pura, con tests)
- **Generación de emails:** `emails/*.tsx` (React Email)
- **Cron logic:** `app/api/cron/*/route.ts`

---

**Última actualización:** 2026-05-21 · Template version: white-label v1
