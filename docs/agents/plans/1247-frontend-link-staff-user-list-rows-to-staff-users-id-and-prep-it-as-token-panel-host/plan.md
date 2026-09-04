# Plan: Frontend — link staff user list rows to /#/staff/users/:id and prep it as token-panel host

Issue: [1247-frontend-link-staff-user-list-rows-to-staff-users-id-and-prep-it-as-token-panel-host.md](../../issues/1247-frontend-link-staff-user-list-rows-to-staff-users-id-and-prep-it-as-token-panel-host.md)

## Overview

Make the already-wired `/#/staff/users/:id` detail page reachable by linking each list row's
**name cell** to it, then refactor the detail helper into composable sub-render sections with a
`null`-returning placeholder for the recovery-token panel that #1244's follow-up sub-issues will
fill. The detail page also gains the user's `status` as a badge (reusing `StaffUserStatusBadges`).
The only non-`frontend` work is one new i18n key (`staff_user_page.status_label`), owned by the
`translator` agent.

## Agents involved

- [frontend](frontend.md) — the row-name link, the `StaffUserHelper` refactor + status badge + panel slot, and the Jasmine specs
- [translator](translator.md) — add the `staff_user_page.status_label` key to every locale

## Shared contracts

**New i18n key** — `translator` produces it, `frontend` consumes it via `Translator.t('staff_user_page.status_label')`:

| Key | `en/staff_user_page.yaml` | `pt/staff_user_page.yaml` |
| --- | --- | --- |
| `staff_user_page.status_label` | `Status` | `Status` |

Placed alongside the existing `name_label` / `email_label` keys in the `staff_user_page:` namespace
(the file already exists in both locales and is already registered in each `index.js` manifest).

**Existing keys reused, no translator work needed** — the status badge text comes from
`StaffUserStatusBadges.build(status)`, which reads the already-present
`staff_users_page.status_pending` / `status_approved` / `status_denied` keys. `frontend` reuses
that class as-is on the detail page; no new status-text keys are added.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/assets/i18n/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- The issue's original text said list rows carry an "Edit" button only; they now also carry
  Approve / Deny / Generate-recovery-link actions (added by sibling #1244 work). None of those
  change — only the name cell gains a link.
- `StaffUser.jsx` needs no change: it already passes the full `user` object (including `status`)
  straight through to `StaffUserHelper.render`.
- The recovery-token panel slot is intentionally a `null`-returning private method for now; the
  follow-up "list a user's recovery tokens" sub-issue fills it in without touching the other
  sections.
