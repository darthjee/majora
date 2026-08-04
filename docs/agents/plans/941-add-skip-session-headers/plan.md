# Plan: Add skip session headers

Issue: [941-add-skip-session-headers.md](../issues/941-add-skip-session-headers.md)

## Overview

Add a shared-secret request header, `X-Statistics-Skip-Secret`, that Navi (the cache warmer) sends on every request. The backend's `StatisticsSessionMiddleware` checks it with a constant-time comparison and, when it matches, skips creating a `statistics.Session` row and its cookie entirely for that request — while remaining fully inert (identical to today's behavior) until the shared secret is actually configured on both sides.

## Agents involved

- [backend](backend.md)
- [cache](cache.md)
- [infra](infra.md)

## Shared contracts

- **Header name:** `X-Statistics-Skip-Secret` (read by Django as `request.META['HTTP_X_STATISTICS_SKIP_SECRET']`).
- **Env var name:** `STATISTICS_SKIP_SECRET`, set to the identical value everywhere it's provisioned (backend and Navi must agree byte-for-byte).
- **Backend contract:** if the header is present, non-empty, and matches the configured secret (via `secrets.compare_digest`), the backend skips statistics-session recording for that request and does not set the statistics cookie. Any other case (header missing, wrong, or secret unconfigured) is indistinguishable from today's normal behavior — no error, no different status code.
- **Cache (Navi) contract:** Navi must send the header on every request via its config's `headers:` substitution mechanism (`X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET`), not by hardcoding a value.
- **Infra contract:** `STATISTICS_SKIP_SECRET` must be exported to both the backend container (already automatic via `.env` + `env_file`) and explicitly passed through to the `majora_navi` service's `environment:` block (not automatic — Navi has no `env_file`). Both must read from the same `.env` value so backend and Navi never disagree.
