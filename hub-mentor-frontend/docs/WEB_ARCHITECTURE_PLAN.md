# Scholar Hub — Web Architecture Restructuring Plan

> **Status:** Proposed · **Owner:** Web team · **Last updated:** 2026-07-13
> **Scope decisions (locked with client/PM):**
> 1. **Single unified web app** with role-based routing (`/admin`, `/mentor`, `/app`) — mirrors the mobile app's `_RootGate`.
> 2. **Full role parity** — build out Admin, Mentor, and Student portals on web to match the Flutter mobile app.
> 3. **Student-only for now** — no PARENT role yet. Parent handling is designed separately in [`PARENT_ROLE_FUTURE.md`](./PARENT_ROLE_FUTURE.md) to be discussed with the client.

---

## 0. TL;DR

The current web app (`hub-mentor-frontend`) is really a **public marketing site bolted onto an admin console**. Mentor and Student "portals" are dead nav links with no routes. There is **no role separation** on the frontend and **no authorization at all** on the backend. The mobile app is far ahead.

This plan restructures the web into **one app with three authenticated shells** (Admin / Mentor / Student) behind a real auth layer, fixes the backend authorization gap, consolidates the UI stack, and phases the build so it ships incrementally.

---

## 1. Where we are today (audit)

### 1.1 Stack inventory

| Layer | Current |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| UI | **shadcn/ui (Radix + Tailwind)** *and* **MUI** (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`) — two design systems in one app |
| Server state | TanStack Query |
| Client/session state | **valtio** proxy `store` (`src/contexts/store.ts`) holding `loggedUser` + modal state |
| Routing | react-router-dom v6, flat route table in `src/App.tsx` |
| Forms | react-hook-form + zod |
| Payments | Razorpay (`src/lib/payment-gateway.ts`) |
| i18n | `LanguageContext` |
| Backend | Express 5 + Mongoose (MongoDB), JWT access/refresh, Cloudinary/multer media, SendGrid/Brevo email, Razorpay, firebase-admin push |

### 1.2 Structural problems

1. **No role separation on the frontend.** Every authenticated screen lives under `/dashboard/*` behind a single `ProtectedRoute` (`src/components/common/ProtectedRoute.tsx`) that **only checks for a token's presence** — no role check. A `STUDENT` can open `/dashboard/mentors` (admin mentor management) by typing the URL.
2. **`ProtectedRoute` is broken.** It hydrates the global store as a **render-time side-effect**, has no loading state, and only redirects when the token is *missing* — a failed/expired verification still renders the protected page.
3. **Mentor & Student portals are dead stubs.** `Sidebar.tsx` defines `student` / `parent` / `mentor` / `admin` nav, but most targets (`/dashboard/messages`, `/resources`, `/students`, `/billing`, `/earnings`) **have no routes in `App.tsx`**. Several dashboard routes (`/dashboard/sessions`, `/schedule`) just render the same `BookingTable`.
4. **Role model mismatch.** Backend roles are `ADMIN | STUDENT | TUTOR` (`backend/src/constants/Auth.ts`). There is **no PARENT role** — "parent" exists only as aspirational UI nav and code comments. `store.getUserRole()` collapses everything into `student | mentor | admin`.
5. **Two UI systems.** MUI and shadcn coexist → inconsistent look, larger bundle, duplicated primitives (date pickers, dialogs).
6. **Fragmented state.** Session lives in `localStorage` + valtio + a React Query verify call, with no single source of truth.
7. **Dead / duplicate files.** e.g. `src/pages/ProfilePage copy.tsx`.
8. **Web is behind mobile.** The Flutter app already routes by role into `AdminShell` / `MentorShell` / student `AppShell` with full feature sets (bookings, earnings, reviews, referrals, ads, push). Web should reach parity.

### 1.3 Backend authorization gap — **CRITICAL**

- `decodeToken()` exists in `backend/src/helpers/Auth.ts` but **is not used as middleware on any route**. A `grep` for `middleware / verifyToken / authorize / requireRole` across `backend/src/routes` returns **nothing** except multer for uploads.
- **Consequence:** every endpoint — mentor CRUD, bookings, enquiries, ads, referral payouts — is **publicly callable without a token**. Some controllers self-filter by role *if* an id is passed, but nothing is enforced.
- **No "proper" role-based login is possible until the backend enforces authentication + authorization.** This is the highest-priority item in the plan and must land in Phase 0.

---

## 2. Target architecture

### 2.1 Principles

- **One app, three shells.** Public site + `Admin` / `Mentor` / `Student` authenticated shells, chosen by role at login (mirrors mobile `_RootGate`).
- **Single source of truth for auth.** One `AuthProvider`; guards read from it; no render-time store mutations.
- **Defense in depth.** Frontend guards for UX; backend middleware for real security.
- **One design system.** Standardize on shadcn/ui + Tailwind; remove MUI.
- **Feature-first folders.** Group by domain/role, not by file type.
- **Parity with mobile**, then web-only enhancements.

### 2.2 Topology — single app, role-based shells

```
scholarhub-web/            (rename of hub-mentor-frontend — optional, cosmetic)
  /                        Public marketing (PublicLayout)
  /mentors, /mentors/:id   Public mentor directory + detail
  /login /signup /verify   Auth flows (AuthLayout)
  /become-a-mentor         Mentor application (creates a pending TUTOR/enquiry)

  /admin/*     ADMIN  →   AdminLayout   (sidebar console)
  /mentor/*    TUTOR  →   MentorLayout  (mentor portal)
  /app/*       STUDENT →  AppLayout     (student portal)
```

A `<RoleGate>` at the post-login boundary redirects by `user.role`:
`STUDENT → /app` · `TUTOR → /mentor` (or `/mentor/onboarding` if profile incomplete) · `ADMIN → /admin`.

### 2.3 Route map (target)

**Public (no auth)**
- `/` landing · `/about` · `/contact-us` · `/terms` · `/privacy` · `/cookies` · `/shipping-policy` · `/cancellations-and-refunds`
- `/mentors` (browse) · `/mentors/:id` (public profile)
- `/login` · `/signup` · `/verify-otp` · `/forgot-password` · `/reset-password`
- `/become-a-mentor` (application form)

**Student — `/app/*` (role: STUDENT)**
- `/app` dashboard/home · `/app/mentors` (browse, logged-in) · `/app/mentors/:id`
- `/app/booking/new/:mentorId` (booking wizard: session mode, board/class, subjects)
- `/app/bookings` (list) · `/app/bookings/:id` (detail) · `/app/payments`
- `/app/reviews` (rate mentors you've booked) · `/app/refer` (refer & earn)
- `/app/profile` · `/app/settings`

**Mentor — `/mentor/*` (role: TUTOR)**
- `/mentor` dashboard · `/mentor/onboarding` (profile completion flow)
- `/mentor/schedule` (upcoming) · `/mentor/sessions` (session logs) · `/mentor/availability` (slots editor)
- `/mentor/earnings` · `/mentor/reviews` · `/mentor/profile` · `/mentor/settings`

**Admin — `/admin/*` (role: ADMIN)**
- `/admin` dashboard · `/admin/enquiries` · `/admin/mentors` + `/admin/mentors/:id` (approve/reject/edit)
- `/admin/classes` · `/admin/subjects` · `/admin/bookings` · `/admin/ads`
- `/admin/reviews` (moderation) · `/admin/referrals` · `/admin/users` · `/admin/settings`

### 2.4 Auth & session design

Replace `ProtectedRoute` + store side-effects with:

- **`AuthProvider`** (React context): on boot, reads token → calls `GET /api/auth/verify-token` → sets `{ user, role, status }` where `status ∈ loading | authenticated | unauthenticated`. Renders a splash while `loading`.
- **`useAuth()`** exposes `user`, `status`, `login()`, `logout()`, `refresh()`.
- **`<RequireAuth>`**: unauthenticated → `/login?next=…`.
- **`<RequireRole roles={[...]}>`**: wrong role → redirect to the user's *own* home (not login), so no confusing loops.
- **axios interceptors** (`src/lib/axios.ts`): attach access token; on a hard `401`, force `logout()` via `authEvents`. *(A one-shot token refresh will slot in here once backend **B9** ships the exchange endpoint; today there's nothing to exchange the refresh cookie for.)*
- Session token stays in `localStorage` (as today) but is **only** read/written through `AuthProvider`.

### 2.5 Backend authorization — **required**

Add two middlewares in `backend/src/middleware/`:

- **`requireAuth`** — reads `Authorization: Bearer <token>`, verifies via `decodeToken`, attaches `req.user`, else `401`.
- **`requireRole(...roles)`** — checks `req.user.role`, else `403`.

Apply across routers, e.g.:

| Route group | Guard |
|---|---|
| `/api/mentor` create/update/delete | `requireAuth, requireRole('ADMIN')` (or mentor self-update) |
| `/api/classes`, `/api/subject` writes | `requireAuth, requireRole('ADMIN')` |
| `/api/booking` create | `requireAuth, requireRole('STUDENT')` |
| `/api/booking` list `:id` | `requireAuth` (controller already role-filters) |
| `/api/inquery-form` list/update | `requireAuth, requireRole('ADMIN')` |
| `/api/ads` `/all`, POST/PUT/DELETE | `requireAuth, requireRole('ADMIN')` |
| `/api/review` POST | `requireAuth, requireRole('STUDENT')` |
| public reads (`GET /api/mentor`, `/api/ads`, `GET /api/mentors/:id`) | none |

> ⚠️ **Coordinate with mobile.** The mobile app must send `Authorization` on protected calls. Verify `AuthCubit`/dio client attaches the JWT before flipping guards on in production, or roll out behind a flag.

### 2.6 State & data layer

- **Server data → TanStack Query** everywhere (keep). Reorganize `src/api/*` into typed modules per domain with query/mutation hooks colocated in features.
- **Session → `AuthProvider`** (context) — single source of truth.
- **Ephemeral UI (modals, language) → keep one small store.** Recommendation: keep **valtio** for modals to minimize churn, but remove `loggedUser` from it (moves to `AuthProvider`). (If we want to standardize later, Zustand is the modern default — noted, not required now.)

### 2.7 Design system consolidation

- **Standardize on shadcn/ui + Tailwind. Remove MUI.** Main migration cost is date pickers (`@mui/x-date-pickers`) → replace with the shadcn `calendar` / `react-day-picker` already installed.
- **Brand tokens (match mobile):** primary blue `#2563EB` → indigo `#1E40AF` → violet `#7C3AED` gradient; accent orange `#F97316`. Define as CSS vars + Tailwind theme.
- **Per-role layout shells:** `PublicLayout`, `AuthLayout`, `AdminLayout` (sidebar), `MentorLayout` (sidebar/bottom-nav responsive), `AppLayout` (student).

### 2.8 Target folder structure

```
src/
  app/
    router.tsx            # route tree, lazy-loaded per role
    providers.tsx         # QueryClient, AuthProvider, Theme, i18n, Localization
    RoleGate.tsx          # post-login role → shell redirect
  config/
    env.ts  roles.ts  constants.ts
  lib/
    axios.ts  queryClient.ts  payment.ts  utils.ts
  auth/
    AuthProvider.tsx  useAuth.ts  guards.tsx   # RequireAuth, RequireRole
    pages/  (Login, Signup, VerifyOtp, ForgotPassword)
  api/                    # typed API clients grouped by domain (reorg of today's src/api)
  components/
    ui/                   # shadcn primitives (keep)
    shared/               # DataTable, GlobalModal, Pagination, form fields
  layouts/
    PublicLayout.tsx  AuthLayout.tsx  AdminLayout.tsx  MentorLayout.tsx  AppLayout.tsx
  features/
    marketing/            # home sections, static pages
    directory/            # public mentor browse + detail
    booking/              # wizard, payment, confirmation
    admin/     { dashboard, enquiries, mentors, classes, subjects, bookings, ads, reviews, referrals, users }
    mentor/    { dashboard, schedule, sessions, availability, earnings, reviews, onboarding, profile }
    student/   { dashboard, bookings, payments, reviews, refer, profile }
  i18n/
  types/
```

---

## 3. Role experiences (feature breakdown)

### 3.1 Public / marketing (unauthenticated)
Landing, mentor directory + public profile, static/policy pages, contact/enquiry form, `become-a-mentor` application. Reuse existing `home/*` sections; restyle to brand tokens.

### 3.2 Auth flows
Login, signup (STUDENT default), email OTP verification, forgot/reset password (**new — backend endpoint needed**), mentor application → admin approval → password emailed. Post-login `RoleGate` routing.

### 3.3 Admin console (parity with mobile `AdminShell`)
- **Dashboard** — real metrics (enquiries, bookings, mentors, revenue) replacing today's hard-coded "12 / 24.5" cards.
- **Enquiries** — list, status update, convert to mentor.
- **Mentors** — list, approve/reject applications, edit, activate/deactivate, view profile.
- **Classes / Subjects** — CRUD.
- **Bookings** — all bookings, filters, status, session logs.
- **Ads** — carousel CRUD (parity with mobile `AdminAdsScreen`).
- **Reviews** — moderation.
- **Referrals** — overview of codes/rewards.
- **Users** — list/manage (**needs backend**); admin account creation (**none today**).
- **Settings** — password, profile.

### 3.4 Mentor portal (parity with mobile `MentorShell`)
- **Dashboard** — upcoming sessions, earnings snapshot, rating, profile-completion banner.
- **Onboarding** — complete profile (qualifications, subjects/classes + pricing, availability, ID proof, payment details) → visibility gate.
- **Schedule** — upcoming/confirmed sessions. **Sessions** — session logs (create/update booking logs).
- **Availability** — edit `available_slot` / `is_available`.
- **Earnings** — derived from bookings today; **add backend aggregation endpoint** so web + mobile share it.
- **Reviews** — read own reviews/rating. **Profile / Settings**.

### 3.5 Student portal (parity with mobile student `AppShell`)
- **Home** — ads carousel, recommended mentors, quick actions.
- **Find mentors** — search (name/subject/headline/location), board(syllabus) + class filter chips.
- **Mentor detail** — profile, reviews, "Book".
- **Booking wizard** — session mode (Online/Offline), board/class, subjects, plan (individual/multiple/full), slot, review → Razorpay payment link.
- **My bookings** — list + detail + status. **Payments** — history.
- **Reviews** — rate mentors you've booked. **Refer & earn** — code, share, stats. **Profile / Settings**.

### 3.6 Cross-cutting
Responsive (mobile-first), i18n pass, toasts, empty/loading/error states, optional web push (defer), accessibility, SEO for public pages.

---

## 4. Backend work required

| # | Item | Priority | Notes |
|---|---|---|---|
| B1 | `requireAuth` + `requireRole` middleware, applied to all non-public routes | **P0** | Core security fix; coordinate with mobile JWT. |
| B2 | Forgot/reset password + resend OTP endpoints | P1 | New auth flows on web. |
| B3 | Mentor **earnings** aggregation endpoint | ✅ Done | `GET /api/booking/mentor/:mentorId/earnings` — total/this-month/pending sums + session counts + recent txns. Also added `PUT /api/mentor/:id/availability` (dedicated, so partial updates can't wipe `selected_class`). |
| B4 | Admin **user management** (list users, create admin, toggle active) | ✅ Done | `controllers/User.ts` + `routes/User.ts` → `GET/POST /api/users`, `PUT /api/users/:id/status`. Admin-gated. |
| B5 | Reviews list (admin) + referral overview (admin) | ✅ Done | `GET /api/review` + `DELETE /api/review/:id` (recomputes rating); `GET /api/referral` overview with totals. |
| B6 | Clean up auth route naming (`/signin` actually registers) | P2 | Cosmetic/DevEx. |
| B7 | **Parent role + student linkage** | Future | See [`PARENT_ROLE_FUTURE.md`](./PARENT_ROLE_FUTURE.md). |
| B8 | Messaging / Resources (if client wants the `Messages`/`Resources` nav) | TBD | Out of scope until confirmed. |
| B9 | **Refresh-token exchange endpoint** (`POST /api/auth/refresh` from the httpOnly cookie) + CORS `credentials` / `sameSite` config | ✅ Done | `refreshAccessTokenController` (rotates the cookie); cookie is now `sameSite:'none'`+`secure`+`maxAge`; web axios sends `withCredentials` and does single-flight silent refresh with request queueing. Also supports a `refreshToken` body fallback for future native-client use. |

---

## 5. Phased delivery plan

> Effort is indicative (1 sprint ≈ 1–2 weeks, one dev). Each phase ends shippable.

### Phase 0 — Foundation *(highest priority)* — ✅ IMPLEMENTED 2026-07-13
- ✅ New structure: `src/config/roles.ts`, `src/auth/` (`AuthProvider`, `guards`, `authEvents`), `src/app/RoleGate.tsx`, `src/features/{mentor,student}/dashboard/`.
- ✅ `AuthProvider` (single source of truth, verify-on-boot, loading gate) + `RequireRole` + `RoleGate`; **`ProtectedRoute` deleted** (no more render-time store mutation).
- ✅ Role-based router in `App.tsx`: `/admin/*`, `/mentor/*`, `/app/*`, each gated by `RequireRole`; `/dashboard/*` → `RoleGate` for backward compat.
- ✅ **Backend `requireAuth` / `requireRole` middleware** (`backend/src/middleware/auth.ts`) applied across all non-public routes.
  - **Staged via `AUTH_ENFORCED` env flag** (default off): guards attach `req.user` but never block, so wiring them can't break the live mobile app. Set `AUTH_ENFORCED=true` once every client is confirmed to send the token to turn on real 401/403 enforcement.
- ✅ Session removed from valtio (`store` is now modal/booking-draft only); login/settings redirect via `roleHome()`.
- ✅ axios `401 → force-logout` (via `authEvents`). *Real* token refresh awaits backend **B9** (no exchange endpoint exists yet) — logout-on-401 is the honest interim behavior.
- ✅ Brand tokens (`brand.*` + `brand-gradient`) added to Tailwind, aligned with mobile. MUI removal (date pickers) deferred to Phase 4.
- ✅ **Verified:** `vite build` + `tsc --noEmit` pass clean on the frontend; `tsc --noEmit` passes on the backend.
- **Acceptance:** each role lands on its own shell; cross-role URLs blocked on the frontend now and on the backend once `AUTH_ENFORCED=true`; logout works; no render-time store mutation. ✔

### Phase 1 — Admin parity — ✅ mobile-parity DONE 2026-07-13
- ✅ All existing admin pages now live under gated `/admin/*` (`RequireRole('ADMIN')`): dashboard, enquiries, mentors (approve/reject via `MentorDetailsPage`), classes, subjects, bookings, settings.
- ✅ **Ads management built** (the one gap vs the mobile `AdminShell`): `src/api/ad/ad-api.ts` (list/create/update/delete) + `src/features/admin/ads/AdminAdsPage.tsx` (table, create/edit dialog with Cloudinary image upload, active toggle, delete confirm) + `/admin/ads` route + sidebar entry.
- ✅ Dashboard shows real metrics (pending/total enquiries, active-mentor count).
- ✅ **Verified:** `tsc --noEmit` + `vite build` pass clean.
- ✅ **Beyond mobile parity, also built:**
  - **Reviews moderation** — `src/features/admin/reviews/` + `src/api/admin/reviews-api.ts` (list, search, delete → mentor rating recomputed). Backend **B5**.
  - **Referrals overview** — `src/features/admin/referrals/` + `referrals-api.ts` (totals + per-referrer table). Backend **B5**.
  - **User management** — `src/features/admin/users/` + `users-api.ts` (list, role filter, search, **create admin/staff**, enable/disable). Backend **B4**.
  - Sidebar + routes wired for all three (`/admin/reviews`, `/admin/referrals`, `/admin/users`).
- **Acceptance:** admin can do everything the mobile `AdminShell` does **plus** reviews/referrals/users management, all guarded by `requireRole('ADMIN')`. ✔ Phase 1 complete (frontend + backend).

### Phase 2 — Mentor portal — ✅ DONE 2026-07-13
- ✅ **Dashboard** — real data: confirmed-sessions count (bookings), this-month earnings (B3), rating (reviews), profile-completion banner.
- ✅ **Earnings** — `src/features/mentor/earnings/` + `src/api/mentor/earnings-api.ts` → total/this-month/pending stat cards + recent transactions (backend **B3**).
- ✅ **Availability** — `src/features/mentor/availability/` + `availability-api.ts` → accepting-bookings toggle + editable time slots (dedicated `PUT /api/mentor/:id/availability`).
- ✅ **Reviews** — `src/features/mentor/reviews/` + `src/api/review/mentor-reviews-api.ts` → average + list (reuses public `GET /api/review/mentor/:id`).
- ✅ **Schedule** (confirmed sessions via `BookingTable`), **Onboarding/Profile** (`ProfilePage` at `/mentor/profile/:id`), **Settings** (`UpdatePassword`) — all gated `RequireRole('TUTOR')`.
- ✅ Sidebar mentor nav + routes wired; `tsc --noEmit` + `vite build` pass clean.
- **Acceptance:** a TUTOR sees their schedule, edits availability, views earnings & reviews, and is nudged to complete their profile. ✔
- **Note:** session-log create/update UI (mentor adding notes per booking) is available through the existing booking flow; a dedicated mentor session-logs screen can be added if the client wants it.

### Phase 3 — Student portal + booking/payments — ✅ DONE 2026-07-13
- ✅ **Home** (`/app`) — ads carousel (public `GET /api/ads`), my-sessions + reward-balance stats, refer CTA, recommended-mentors grid. `src/features/student/dashboard/`.
- ✅ **My Bookings** (`/app/bookings`) — reuses the role-aware `BookingTable` (student sees own bookings + Razorpay **pay** button via existing `create-payment-link` + `makePayment`).
- ✅ **Rate Mentors** (`/app/reviews`) — lists booked mentors, star+comment dialog → `POST /api/review`. `src/features/student/reviews/` + `src/api/review/create-review.ts`.
- ✅ **Refer & Earn** (`/app/refer`) — code copy/share (Web Share API), referral count + reward balance, referred-users table. `src/features/student/refer/` + `src/api/referral/referral-api.ts`.
- ✅ **Settings** (`/app/settings` → `UpdatePassword`); all gated `RequireRole('STUDENT')`; sidebar student nav + routes wired.
- ✅ **Browse / detail / booking wizard** reuse the existing public pages (`/mentors`, `/mentors/:id`, `/booking/:id`) which already have search + board/class filters + session-mode + Razorpay. The student shell links into them.
- ✅ `tsc --noEmit` + `vite build` pass clean.
- **Acceptance:** a STUDENT sees ads/mentors on home → browses → books → pays (Razorpay) → sees the booking → rates the mentor → shares a referral code. ✔
- **Note:** browse/detail/booking run in the **public** layout (they predate the shell), so a logged-in student briefly leaves the sidebar shell there — consistent with today's app; unifying them under `/app` is a Phase 4 polish item if desired.

### Phase 4 — Polish — ✅ core DONE 2026-07-13
- ✅ **MUI fully removed.** Migrated the only 3 usages: MUI `TimePicker` → native `<input type="time">` (`TimeSlot.tsx`), MUI `Button` → shadcn `Button` (`UpdatePassword.tsx`), and dropped the `LocalizationProvider` wrapper (`App.tsx`). Removed `@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`, `@emotion/react`, `@emotion/styled` from `package.json`. **One design system (shadcn) now.**
- ✅ **Dead code removed:** `ProfilePage copy.tsx`, `ProtectedRoute.tsx` (earlier), `api/auth/refreshToken.ts` (unused after AuthProvider).
- ✅ **Code-splitting:** all route components are `React.lazy` + `<Suspense>`. Initial JS bundle **1146 kB → 465 kB** (gzip 152 kB); per-route chunks load on demand; the >500 kB build warning is gone.
- ✅ **Tests:** vitest added (`npm test`) with unit tests for the core role logic (`src/config/roles.test.ts`, 6 passing) — `roleSlug` / `roleHome` / `roleBase` and their consistency.
- ✅ **Verified:** frontend `tsc` + `vite build` + `vitest`, and backend `tsc` all green.
- **Acceptance:** one design system, clean build under the size budget, tests green. ✔
- **Remaining polish (optional, not blocking):** full i18n string pass (infra exists — `LanguageContext`/`LanguageSwitcher`), unify the public browse/booking pages under the `/app` shell, component/guard tests via React Testing Library, optional web push. Infra items: flip `AUTH_ENFORCED=true` after confirming mobile sends its JWT; deploy backend (new endpoints) + web.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Turning on backend auth breaks the live mobile app | Verify mobile dio client sends `Authorization`; roll out guards behind a flag / staged. |
| MUI removal touches booking date pickers | Migrate to shadcn `calendar` / `react-day-picker` (already a dep) in an isolated PR. |
| Scope creep from `Messages`/`Resources`/`Billing` nav | Keep out of scope until client confirms; hide those nav items. |
| Parent introduced later forces schema churn | Design student model to be parent-ready now; capture in `PARENT_ROLE_FUTURE.md`. |
| Big-bang rewrite risk | Strangler approach — new shells alongside old routes, migrate feature-by-feature, delete old `/dashboard/*` last. |

---

## 7. Open questions for client

1. **Parent role** — scope, child linkage, who pays/books (drives `PARENT_ROLE_FUTURE.md`).
2. **Messaging** — is student↔mentor chat in scope? (`Messages` nav currently dead.)
3. **Resources/materials** — real feature or remove from nav?
4. **Availability ownership** — mentors self-serve slots, or admin sets them?
5. **Admin provisioning** — how are ADMIN accounts created (no signup path today)?
6. **Web push** — needed on web, or mobile-only?

---

## 8. Appendix — naming, env, deploy

- **Rename** `hub-mentor-frontend` → `scholarhub-web` (optional; it's the whole web app, not mentor-only).
- **Env (web):** single `VITE_API_BASE_URL` (points at Railway backend `…/api`), `VITE_RAZORPAY_KEY`. Centralize in `config/env.ts`.
- **Env (backend):** `AUTH_ENFORCED=true` turns on real 401/403 enforcement in the new auth middleware (default off = staged/no-op). Flip it only after confirming every client (web + mobile) sends `Authorization: Bearer <token>`.
- **Deploy:** unchanged (static SPA). Ensure SPA fallback so deep links like `/admin/mentors/:id` resolve.
- **Backend** deploy adds the new middleware + endpoints (B1–B4); no new infra.
