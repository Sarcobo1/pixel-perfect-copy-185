## SOTA Flovo — landing + full app

Port the SOTA Flovo landing page to TanStack Start and add the full internal SaaS shell described in the spec (sidebar app with Dashboard, 6-step Project Editor wizard, Timeline editor, Render monitor, Settings, Billing). Light "white + lime" theme everywhere, dark canvas only inside the video preview. Animations via GSAP + ScrollTrigger; Three.js for the hero background. Lovable Cloud powers auth, projects persistence, and realtime render status. Real video rendering is simulated (no actual encoder runs in the worker runtime).

## Design system

Lift tokens from the uploaded HTML into `src/styles.css` (oklch). Semantic names mapped to Tailwind utilities:
- `background` #fbf9f8, `surface` white, `surface-container` #efeded
- `primary` lime #a3e635, `primary-hover` #84cc16, `primary-soft` #ecfccb
- `foreground` #0a0a0a, `muted-foreground` #737373
- `canvas` #0a0a0f (dark video island only)
- `success` lime, `destructive` #ef4444
- Fonts: Geist (display/headlines/buttons), Inter (body), JetBrains Mono (labels)
- Radii, shadows (`shadow-lime-glow`), and a `pulse-lime` keyframe

## Routes

Public:
- `/` — SOTA Flovo landing (hero with Three.js cubes, social proof, features bento, how-it-works, demo, pricing, footer, magnetic CTA, GSAP word-drop + scrambling/typewriter, 3D tilt card)
- `/login`, `/signup`, `/reset-password`

Authenticated (`_authenticated` layout = sidebar 260↔72px collapsible + sticky top bar):
- `/dashboard` — stats row (count-up), recent projects grid, Quick Start banner, empty state
- `/projects` — list + filters
- `/projects/new` — creates project then redirects to wizard
- `/projects/$id` — 6-step wizard (Brand → Logo → Palette → Voice → Timeline → Render) with sticky step indicator and animated step transitions
- `/settings` (tabs: Account, Plan & Billing, API Keys)
- `/billing`

Each route file gets its own `head()` meta. Errors/notFound boundaries per template rules.

## Lovable Cloud / data model

Tables (RLS + grants per template rules):
- `profiles` (id → auth.users, display_name, avatar_url, plan: free|pro|api) + auto-create trigger on signup
- `projects` (id, owner_id, name, status: draft|processing|done|failed, thumbnail_url, duration_ms, created_at, updated_at)
- `project_steps` (project_id, step: brand|logo|palette|voice|timeline|render, data jsonb, completed_at)
- `render_jobs` (id, project_id, progress int, status, message, frames jsonb, updated_at) — for realtime
- `app_user_roles` + `has_role()` security-definer (admin/user) for future RBAC

Auth: email/password + Google (via Lovable broker + `configure_social_auth`). Single root `onAuthStateChange` to invalidate queries.

Server functions (`createServerFn` under `src/lib/*.functions.ts`, all auth-protected):
- `createProject`, `listProjects`, `getProject`, `updateProjectStep`
- `startRender` (creates `render_jobs` row, simulates progress via `setTimeout` chain writing rows — client subscribes to realtime updates)
- `extractBrand` (stub returning mocked logo/palette/copy from URL)
- `generateVoice` (stub returning a mocked waveform + audio URL)

## Component map

- `components/layout/`: AppSidebar (shadcn sidebar, lime active border + slide-in), TopBar (search, plan badge, notif bell, avatar menu), PageTransition wrapper
- `components/landing/`: HeroCanvas (Three.js cubes), Nav, FeaturesBento, HowItWorks, Pricing, Footer, MagneticButton
- `components/dashboard/`: StatCard (count-up), ProjectCard, QuickStartBanner, EmptyState
- `components/editor/`: StepIndicator, BrandExtractor, LogoPicker, PaletteSelector (6 curated cinematic palettes), VoiceGenerator (waveform), TimelineEditor (tracks, draggable events, playhead, zoom), PreviewPlayer (dark canvas island), RenderMonitor (circular progress + scramble text + completion burst), EventDetailPanel (slide-in)
- `components/ui-extras/`: AnimatedButton, Toast (sonner skin), ProgressCircle, ScrambleText, TextReveal, SkeletonCard
- `hooks/`: useGsap (registers ScrollTrigger once), useCountUp, useRealtimeRender, useProjectStore (Zustand for editor draft state)
- `lib/palettes.ts`, `lib/animations.ts`

## Animations

GSAP + ScrollTrigger globally registered once. Patterns reused across pages: word-drop headlines (`.drop-headline`), typewriter body (`.type-text`), bento card stagger reveal, magnetic CTA, 3D tilt on hero & pricing cards, sidebar/topbar entrance, page transitions, step wizard slide, render burst.

## Scope notes / mocks

- Three.js, GSAP installed as npm deps (no CDN); SSR-safe — initialize inside `useEffect`.
- Render pipeline is **simulated** (timer + DB writes). No real ffmpeg/remotion in the Worker.
- Stripe/LemonSqueezy billing is UI-only (badges + buttons); wiring real checkout is a follow-up.
- Brand extraction & voice generation return canned data (real APIs are a follow-up).
- Mobile: sidebar becomes bottom tab bar (<768px), wizard goes full-screen per step.

## Technical notes

- Tech: TanStack Start (existing template) — not Next.js. File-based routing under `src/routes/`, server logic via `createServerFn` (not Edge Functions). The spec's `app/(dashboard)/...` paths map to `src/routes/_authenticated/...`.
- `src/start.ts` will register `attachSupabaseAuth` in `functionMiddleware` so protected server fns get the bearer token.
- All new public schema tables include `GRANT`s for `authenticated`/`service_role` plus RLS policies scoped via `auth.uid()` / `has_role()`.
- `client.server` imports stay isolated to `*.functions.ts`; never touched from components.
- Images on the landing currently use `lh3.googleusercontent.com` URLs from the source HTML — replaced with generated assets (`imagegen`) saved to `src/assets/` to avoid hotlink decay.
- Build is large; I'll land it in waves: tokens + landing first, then auth + shell, then dashboard, then wizard steps 1–3, then 4–6, then settings/billing.

## Assumptions (flag if any are wrong)

- Auth: email/password + Google. Profiles table with display_name + avatar.
- Real render/voice/brand-extract are simulated for now.
- One workspace per user (no teams).
- English copy only.
