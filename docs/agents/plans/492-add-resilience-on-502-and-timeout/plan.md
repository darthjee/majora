# Plan: Add resilience on 502 and timeout

Issue: [492-add-resilience-on-502-and-timeout.md](../../issues/492-add-resilience-on-502-and-timeout.md)

## Overview

Introduce a reusable retry primitive that GET requests going through `BaseClient#request`
use automatically: on a `502` response or a request timeout, it retries indefinitely (no
cap) until the request succeeds, instead of surfacing the transient cold-start error to the
caller. A new header component shows the app's current resilience state (idle / requesting /
retrying) to all users. New user-facing text needs translation keys in both bundled
languages.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend adds three new i18n keys under the `header:` section of
`frontend/assets/i18n/en.yaml` (and asks the translator agent to mirror them into
`pt.yaml`), consumed via `Translator.t('header.<key>')` by the new status-indicator
component:

| Key | English value | Alt text purpose |
|-----|----------------|-------------------|
| `header.resilience_idle_alt` | `Idle` | shown when no resilient request is in flight |
| `header.resilience_requesting_alt` | `Requesting` | shown while a resilient request is in flight |
| `header.resilience_retrying_alt` | `Retrying` | shown while the last attempt failed (502/timeout) and a retry is pending |

The frontend agent adds the English entries (placeholder or final English copy) to
`en.yaml` as part of its own change (so the app isn't left with missing keys / a failing
`check_i18n` CI step); the translator agent is only responsible for adding the matching
`pt.yaml` entries with the same three keys, once the English keys exist.
