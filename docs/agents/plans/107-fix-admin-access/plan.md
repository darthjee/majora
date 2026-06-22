# Plan: Fix admin access

Issue: [107-fix-admin-access.md](../issues/107-fix-admin-access.md)

## Overview
Django's CSRF protection rejects admin POST requests from `https://moria.ffavs.net` because that origin isn't listed in `CSRF_TRUSTED_ORIGINS`, which isn't currently exposed as configuration at all. We'll add a `CSRF_TRUSTED_ORIGINS` environment variable (parsed the same way `ALLOWED_HOSTS` already is) and document it alongside the existing `ALLOWED_HOSTS` sample value.

## Agents involved

- [backend](backend.md)
- [infra](infra.md)

## Shared contracts

- New environment variable: `CSRF_TRUSTED_ORIGINS`.
  - **Format:** comma-separated list of full origins **including scheme** (e.g. `https://moria.ffavs.net,https://example.com`) — unlike `ALLOWED_HOSTS`, Django requires a scheme for each entry in `CSRF_TRUSTED_ORIGINS`.
  - **Default when unset/empty:** no trusted origins are added (empty list), preserving today's behavior for hosts that don't need cross-origin admin/API POSTs.
  - **Consumer:** `backend` reads it in `source/majora_project/settings.py` to populate `CSRF_TRUSTED_ORIGINS`.
  - **Declarer:** `infra` documents it in `.env.dev.sample` next to `ALLOWED_HOSTS`, so every environment knows the variable exists and its expected format.
