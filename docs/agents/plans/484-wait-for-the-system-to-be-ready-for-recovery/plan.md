# Plan: Wait for the system to be ready for recovery

Issue: [484-wait-for-the-system-to-be-ready-for-recovery.md](../../issues/484-wait-for-the-system-to-be-ready-for-recovery.md)

## Overview

The recover-password page (`/#/recover-password?token=<TOKEN>`) will poll the
existing health-check endpoint (`/health.json`, via `HealthClient`, the same
one already used by the app header) before rendering the recovery form. A
`502` response or a request timeout is treated as "not ready yet" and
triggers another attempt after a short delay; only a `200` response allows
the form to render. While waiting, the page shows a waiting message instead
of the form or an error.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- New i18n key: `recover_password_page.waiting_for_server` — text shown
  while the page is waiting for the backend to become ready (e.g. "Waiting
  for the server to be ready…"). The `frontend` agent renders it via
  `Translator.t('recover_password_page.waiting_for_server')`; the
  `translator` agent adds the key (and its translations) to every
  `frontend/assets/i18n/*.yaml` file, keeping key parity.
