# Parent Role — Future Design (for client discussion)

> **Status:** Not built. Deferred by decision on 2026-07-13 — ship **student-only** first, add PARENT after discussing the model with the client.
> This doc exists so the current build stays **parent-ready** and we have a concrete proposal to review.
> Companion to [`WEB_ARCHITECTURE_PLAN.md`](./WEB_ARCHITECTURE_PLAN.md).

---

## 1. Why it's deferred

Backend roles today are `ADMIN | STUDENT | TUTOR` — there is **no PARENT role**. "Parent" appears only as aspirational UI nav and comments. Adding it properly touches the data model, booking/payment ownership, and the auth model, so we're shipping student-first and designing parent deliberately.

## 2. The core product question

**Who is the account holder, and who is the learner?** Three models to choose between:

| Model | Data shape | Best when |
|---|---|---|
| **A. Real PARENT + child profiles** | Parent is the account; students are linked child profiles (may have no login). Parent books/pays/sees all children. | Younger students; guardians manage everything. Most flexible, most work. |
| **B. Combined guardian/student account** | One account books for self *or* a named child (child = field on booking, not a login). | Simple; "parent" is just an onboarding label. Lowest effort. |
| **C. Linked accounts** | Both parent and student have logins; parent is granted visibility over linked student(s). | Older students who also log in, with parental oversight. |

**Recommendation to discuss:** **Model A** for real tutoring-business fit, with an option for a linked student login later (a lightweight path to C). Confirm with client.

## 3. Proposed backend changes (Model A)

- Add `PARENT` to `ROLES` in `backend/src/constants/Auth.ts`.
- On the `AuthModal` schema (`backend/src/models/Auth.ts`):
  - `guardianOf: [ObjectId ref AuthModal]` on the parent.
  - `guardian: ObjectId ref AuthModal` (optional) on the student.
  - `isChildProfile: Boolean` for students created by a parent without their own login.
- **Bookings** (`backend/src/models/Booking.ts`): keep `studentId` = the learner; add `bookedBy` = the payer/account holder (parent or student). Reviews, referrals, and payments attach to `bookedBy`.
- **Endpoints:**
  - `POST /api/parent/children` (create child profile) · `GET /api/parent/children` · `PUT/DELETE …/:id`.
  - Scope existing list endpoints (`/booking`, `/review`) so a parent sees the union across their children.
- **Referral / rewards** accrue to the parent account.

## 4. Proposed frontend (fits the planned architecture)

- New shell **`/parent/*`** with `ParentLayout`, gated by `requireRole('PARENT')`; `RoleGate` routes `PARENT → /parent`.
- Screens: **Dashboard** (all children at a glance), **My Students** (add/edit child profiles, per-child progress), **Sessions** (across children, filter by child), **Find Mentors** → **Booking wizard** (choose *which child* the booking is for), **Billing/Payments**, **Refer & earn**, **Settings**.
- Booking wizard gains a **"Booking for"** step (select child) when the account is a PARENT.
- Reuse the student portal's mentor directory, detail, and booking components — parameterized by the target student id.

## 5. Keeping the current build parent-ready

Do these now (cheap) so parent slots in later without churn:

1. Model bookings around a **learner id + payer id** conceptually, even if they're the same STUDENT today (don't hard-assume `studentId === logged-in user`).
2. Keep `RoleGate` and `requireRole` **data-driven** (a roles map), so adding `PARENT` is one entry, not a refactor.
3. Keep the booking wizard's "who is this for" implicit-but-isolated, so a "select child" step drops in.
4. Don't bake "the logged-in user is always the student" into API hooks — pass ids explicitly.

## 6. Open questions for the client

1. Do parents create **child logins**, or manage **profiles only**?
2. Can a student **also** log in when a parent manages them? (Model A vs C.)
3. One parent ↔ **many** children? Two parents ↔ one child (co-guardians)?
4. Who owns **payments and referral rewards** — parent or student?
5. Should mentors see the **parent** contact, the **student**, or both?
6. Migration: do any existing STUDENT accounts need converting to PARENT + child?

## 7. Rough effort (when greenlit)

Backend model + endpoints ≈ 0.5–1 sprint · Parent shell + screens ≈ 1 sprint · Booking "for child" + billing ≈ 0.5 sprint. **≈ 2–2.5 sprints**, assuming the student portal (Phase 3) already exists to reuse.
