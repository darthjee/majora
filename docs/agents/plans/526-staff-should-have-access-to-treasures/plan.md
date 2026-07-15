# Plan: Staff should have access to treasures page and endpoints

Issue: [526-staff-should-have-access-to-treasures.md](../../issues/526-staff-should-have-access-to-treasures.md)

## Overview

Broaden the `Staff` role (Django `is_staff=True`) from "additive, User-management only" to
full parity with Superuser on any endpoint that is **not scoped under a specific game**.
Today that means: User management (already correct) and the global Treasure surface
(`/#/treasures`, `/#/treasures/new`, `/#/treasures/:id/edit`, and the backing
`/treasures.json`/`/treasures/:id.json`/`/treasures/:id/photo_upload.json` endpoints).
Game-scoped Treasure routes (`/games/:game_slug/treasures*`) are explicitly excluded and
keep being governed solely by GameMaster/Superuser. Backend fixes the permission logic at
its single root (`Treasure.can_be_edited_by`) so every dependent endpoint (update, photo
upload, `permissions.json`'s `can_edit`) stays consistent automatically; frontend mirrors
the existing `staffOrSuperuser` route-guard/UI pattern already used for staff-user pages.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **No new API shape.** The `/treasures.json` (list/create), `/treasures/:id.json`
  (detail/update), `/treasures/:id/photo_upload.json`, `/treasures/:id/permissions.json`,
  and `/treasures/:id/access.json` endpoints keep their existing response shapes. The only
  change is *who* is authorized to call the write ones (create/update/photo-upload) and
  what `can_edit` evaluates to in `permissions.json` — `is_staff` now behaves like
  `is_superuser` for a **global** treasure (`game_id is None`), no change for a game-scoped
  treasure.
- **`is_staff`/`is_superuser` are already exposed** on `/auth/status.json`
  (`backend/games/views/auth/status.py`) and on `TreasureAccessSerializer`'s
  `access.json` response — frontend does not need any new field from backend, it already
  has what it needs via `AccessStore`.
- **Frontend depends on no new backend behavior to build its route guard/UI change** — the
  frontend change (route `kind: 'staffOrSuperuser'`, `AccessStore.ensureStaffOrSuperUser()`)
  is independent of backend's rollout and can land in the same PR without ordering
  constraints, mirroring the existing `staffUsers`/`staffUser`/`staffUserEdit` pattern.
- **Correction to the issue's scope text:** there is no application-level DELETE endpoint
  for a global treasure at all — deletion is Django-admin-only and stays out of scope per
  `docs/agents/access-control.md`'s admin carve-out. Neither agent should add one.

## Notes

- This is a real policy change, not just a bug fix: `docs/agents/product.md`'s current
  "Staff Role" section explicitly names Treasure management as something Staff must *not*
  get (`"...never any other Superuser-only capability... (e.g. Treasure management)"`).
  That sentence — and the matching line in
  `docs/agents/access-control/user-roles.md` — must be rewritten, not extended. See
  backend.md for the exact wording.
- Precedent already exists in code for "Staff-or-superuser" gating one non-user-management
  endpoint: `/users/test-email.json` (`docs/agents/access-control/endpoints.md`). The docs
  update generalizes the policy rather than inventing a new concept.
