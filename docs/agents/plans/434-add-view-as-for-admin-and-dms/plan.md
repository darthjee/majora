# Plan: Add view as for admin and DMs

Issue: [434-add-view-as-for-admin-and-dms.md](../issues/434-add-view-as-for-admin-and-dms.md)

## Overview

Add a purely frontend "view as" facade: a header button (visible only to real
Superusers/Staff) opens a modal letting them simulate `dm`/`player`/`owner` roles. While
active, `AccessStore` requests per-resource `permissions.json` with the simulated
`role` query parameter (introduced by #433) instead of the real requester's identity, so
game/character/treasure pages render as a lesser-privileged user would see them. No
backend changes — the backend keeps authorizing every write against the requester's real
identity regardless of any active facade.

**Blocked on #433**: this plan assumes `permissions.json`'s `role` query parameter and
`AccessStore`'s `ensure*Access`/`ensure*Permissions` split (see
`docs/agents/plans/433-.../frontend.md`) already exist. Do not start implementation
until #433's frontend half is merged.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New translation keys (translator produces, frontend consumes via `Translator.t()`)

- `header.view_as_alt` — alt/tooltip text for the new header button icon, alongside the
  existing `header.my_account_alt` (`frontend/assets/i18n/en.yaml`/`pt.yaml`, `header`
  namespace).
- New `view_as_modal` namespace: `title`, `enabled_label` (the on/off checkbox), one
  label per simulatable role (`role_dm`, `role_player`, `role_owner`), `cancel`, `save` —
  mirroring the existing `login_modal` namespace's shape (`title`, field labels,
  `cancel`, a submit-style key).

Frontend calls `Translator.t('view_as_modal.<key>')` / `Translator.t('header.view_as_alt')`
exactly as it already does elsewhere (e.g. `header.my_account_alt`,
`login_modal.cancel`).

### No backend/API contract

Everything here consumes an interface #433 already defines (`permissions.json`'s `role`
param). No new endpoint, field, or response shape is introduced by this issue.

## Notes

- No `data-access`/`security` review is needed for this issue specifically — it adds no
  endpoint and changes no authorization logic (per the issue's own "Description": purely
  a frontend rendering concern). #433's own review notes already cover the `role`
  parameter's security shape.
