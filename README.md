# Radar I+D · I+D Hub

Plataforma interna de **inteligencia colectiva para Investigación y Desarrollo** de doinGlobal.
No es un foro: es un radar estratégico para capturar conocimiento disperso, debatir oportunidades,
priorizar señales de mercado y convertir aportes del equipo en insumos accionables.

Construido sobre el diseño hi-fi de Claude Design (carpeta `I+D Hub pantallas hi-fi/`, que se conserva
como **fuente visual de verdad**).

## Stack

- **Next.js 16** (App Router, TypeScript) + **React 19**
- **Supabase** — Auth + Postgres + RLS (sesión persistente por cookies vía `@supabase/ssr`)
- **Gemini API** (Google AI Studio, free tier) — toda la IA, aislada en `lib/gemini` (server-only)
- **lucide-react** para iconos · sistema de diseño doinGlobal (tokens + fuentes en `app/ds` y `public/fonts`)
- Gráficos del dashboard: **solo CSS** (sin librería de charts)

## Requisitos previos

1. **Node.js 18.18+**
2. Un proyecto **Supabase** (free tier) → URL y anon/publishable key.
3. Una **Gemini API key** gratuita: https://aistudio.google.com/app/apikey

## Configuración

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local
#   Completá en .env.local:
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY
#   (GEMINI_MODEL es opcional; por defecto gemini-2.0-flash)

# 3. Base de datos (Supabase CLI)
npx supabase link --project-ref TU-PROJECT-REF   # el ref está en https://TU-REF.supabase.co
npx supabase db push                             # aplica supabase/migrations (0001 y 0002)
npx supabase gen types typescript --linked > lib/database.types.ts   # opcional

# 4. Desarrollo
npm run dev      # http://localhost:3000
```

### Importante: confirmación de email

Para que el **registro inicie sesión directo** (como define el MVP), en el panel de Supabase:
**Authentication → Sign In / Providers → Email → desactivá "Confirm email"**.
Si lo dejás activado, el registro pedirá confirmar el correo antes de poder iniciar sesión.

### Convertirte en administrador

El primer usuario se crea con rol `usuario`. Para poder cambiar estado/prioridad/categoría de
publicaciones y administrar insignias, promové tu cuenta a `admin` (Supabase → SQL Editor):

```sql
update public.profiles set rol = 'admin'
where email = 'tu-email@doinglobal.com';
```

## Funcionalidades

- **Auth**: registro (nombre, email, contraseña + confirmación), login, logout, sesión persistente,
  rutas internas protegidas (middleware/proxy + guard de layout).
- **Radar (feed)**: publicaciones con filtros (recientes / más votadas / más comentadas / alta prioridad / categoría).
- **Publicar**: URL, título, categoría, prioridad (semáforo), resumen, relevancia, etiquetas, aplicación interna,
  con **"Analizar con IA"** (resumen automático, ideas, riesgos, etiquetas y categoría sugeridas).
- **Detalle**: votos/reacciones (5 tipos, sin duplicar), comentarios, **síntesis IA del debate**,
  **generador de brief**, línea de estado y controles de moderación (admin/mod).
- **Ranking**: los 7 rangos, tabla de participación, insignias.
- **Perfil**: identidad, progreso de rango, estadísticas e historial.
- **Tendencias**: tracción por tema + **detección de oportunidades con IA** (solo datos internos).
- **Panel ejecutivo**: KPIs, estado del contenido (donut), categorías más activas, tracción y contribución.

### Sistema de puntos (calculado en la base, vía triggers)

| Acción | Puntos |
|---|---|
| Crear perfil completo | 20 |
| Publicar enlace | 10 |
| Añadir resumen propio | 15 |
| Comentar | 5 |
| Recibir voto positivo (al autor) | 3 |
| Publicación marcada como relevante | 25 |
| Crear síntesis ejecutiva | 30 |
| Proponer oportunidad de programa | 40 |

Rangos: Observador (0) · Explorador (100) · Curador (400) · Analista (1000) · Referente (2500) ·
Estratega I+D (4500) · Mentor de Innovación (7000).

## Seguridad

- **RLS** en todas las tablas, solo usuarios autenticados (sin acceso anónimo).
- Un usuario solo edita sus propias publicaciones/comentarios; solo admin/mod cambian estado/prioridad/categoría.
- La **GEMINI_API_KEY nunca llega al cliente**: `lib/gemini` usa `import "server-only"` y las llamadas
  corren en Route Handlers. No se usan OpenAI ni Anthropic. No hay claves hardcodeadas.

## Estructura

```
app/(auth)/        login · register · acciones de auth
app/(app)/         radar · post/[id] · publicar · ranking · perfil · tendencias · panel (protegidas)
app/api/ai/        summary · synthesis · opportunities · brief (server-only)
components/         shell · ui · feed · post · publish · ranking · profile · trends · dashboard
lib/supabase/      clientes browser/server + proxy
lib/gemini/        servicio Gemini aislado (client, prompts, schemas, index)
lib/data/          capa de acceso a datos (posts, profiles, dashboard)
supabase/migrations/  0001_init.sql · 0002_auth_hook.sql
```

## Despliegue (Vercel / Netlify)

Cargá las mismas variables de entorno en el panel del host
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, opcional `GEMINI_MODEL`)
y agregá la URL de producción a **Supabase → Authentication → URL Configuration → Redirect URLs**.

### Notificaciones por email (Resend)

Para que las notificaciones funcionen en producción, además cargá:

- `RESEND_API_KEY` — clave de [Resend](https://resend.com/api-keys).
- `EMAIL_FROM` — remitente verificado, ej. `Radar I+D <radar@doinglobal.com>`.
  Requiere **verificar el dominio `doinglobal.com` en Resend** (registros SPF/DKIM en DNS).
  Sin dominio verificado, Resend solo entrega desde `onboarding@resend.dev` y solo a la
  dirección dueña de la cuenta.
- `SUPABASE_SERVICE_ROLE_KEY` — service-role (Supabase → Project Settings → API). **Server-only**:
  saltea RLS para leer destinatarios y escribir en la cola `notifications`. Nunca exponer en el cliente.
- `NEXT_PUBLIC_APP_URL` — URL pública para los links de los emails (sin barra final), ej. `https://tu-app.vercel.app`.
- `CRON_SECRET` — string aleatorio largo que protege `/api/cron/weekly-digest`. Vercel Cron lo
  envía solo como `Authorization: Bearer <CRON_SECRET>` (ver `vercel.json`, lunes 11:00 UTC).

Aplicá todas las migraciones de `supabase/migrations/` al proyecto remoto (`supabase db push` o el
SQL editor). Si falta `RESEND_API_KEY`, el envío se omite silenciosamente (la app sigue funcionando).

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir el build
