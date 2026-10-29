# Plan: Statistics bug: show the session tracking columns on the staff visits page (frontend)

Issue: [1714-statistics-bug-show-the-session-tracking-columns-on-the-staff-visits-page-frontend.md](../../issues/1714-statistics-bug-show-the-session-tracking-columns-on-the-staff-visits-page-frontend.md)

## Overview

Show the five tracking fields that `staff/statistics/visit-list.json` returns since #1713 on
the staff statistics Visit list tab: the controller maps them (keeping `null`), the table gains
two non-sortable columns (**Paths** and **Session**), creation reasons get translated labels in
`en` and `pt`, and the statistics docs describe the columns. No backend change.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

Translation keys under `staff_statistics_page.visit_list` (in `frontend/assets/i18n/en/staff_statistics_page.yaml` and `pt/`):

| Key | `en` |
|-----|------|
| `paths` | Paths |
| `session` | Session |
| `first_path` | First |
| `last_path` | Last |
| `session_first_path` | First path |
| `creation_reason` | Reason |
| `first_seen_logged` | Logged in at creation |
| `yes` | yes |
| `no` | no |
| `unknown` | unknown |
| `creation_reasons.no_cookie` | No cookie |
| `creation_reasons.invalid_cookie` | Invalid cookie |
| `creation_reasons.cookie_session_not_found` | Cookie session not found |
| `creation_reasons.domain_changed` | Domain changed |
| `creation_reasons.ip_changed` | IP changed |
| `creation_reasons.login_rotation` | Login rotation |

The frontend looks reasons up as `creation_reasons.<raw value>` and falls back to the raw value
for an unknown one; the translator must keep the `creation_reasons` keys equal to the six raw
values.
