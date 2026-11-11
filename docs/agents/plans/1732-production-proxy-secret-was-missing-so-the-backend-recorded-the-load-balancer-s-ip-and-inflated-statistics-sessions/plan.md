# Plan: Production: proxy secret was missing, so the backend recorded the load balancer's IP and inflated statistics sessions

Issue: [1732-production-proxy-secret-was-missing-so-the-backend-recorded-the-load-balancer-s-ip-and-inflated-statistics-sessions.md](../../issues/1732-production-proxy-secret-was-missing-so-the-backend-recorded-the-load-balancer-s-ip-and-inflated-statistics-sessions.md)

## Overview

Keep the proxy secret from silently going missing again. The proxy deploy fails when the
release's `locals.php` has no non-empty `$proxySecret`; the backend logs a startup warning
when it runs with `DEBUG` off and `PROXY_SECRET` empty; a new doc lists the production
configuration keys and the rotation procedure. Trust logic is unchanged.

## Agents involved

- [infra](infra.md)
- [backend](backend.md)

## Shared contracts

- **Secret pairing:** Tent's `$proxySecret` (server-side `configuration/locals.php`) and the
  backend's `PROXY_SECRET` (Render env var) must hold the same non-empty value. Neither agent
  ever commits, prints or logs the value.
- **"Production settings" on the backend** means `settings.DEBUG` is `False`
  (`DJANGO_DEBUG=false`), the same switch production already uses.
- **Backend warning text** (documented by infra, emitted by backend): logger `common`, level
  `WARNING`, message
  `PROXY_SECRET is not set: X-Forwarded-For is ignored and client IPs fall back to REMOTE_ADDR`.
- **Doc location:** `docs/agents/production-configuration.md` (infra writes it; backend's
  warning and `docs/agents/statistics.md` link to it).
