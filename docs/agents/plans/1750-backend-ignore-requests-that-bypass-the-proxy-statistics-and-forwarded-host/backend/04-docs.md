# Docs under docs/agents

Update the backend-facing docs to describe the new trust gate:

- `docs/agents/statistics.md` "Client IP integrity": requests without a valid secret are no
  longer tracked at all, `X-Forwarded-Host` is now gated too (replace the "not covered by
  the secret gate" sentence), and expect session counts to drop after deploy because direct
  traffic (including the health check) is no longer counted.
- `docs/agents/access-control/game.md` "Trust assumption": `X-Forwarded-Host` is honored only
  from the proxy (`ProxyTrustMiddleware`), so the domain gate now holds against direct callers
  while `PROXY_SECRET` is set. Remove the "separate follow-up" wording.
- `docs/agents/access-control/endpoints.md`: the health check endpoint is `/ready.json`, not
  `/health.json`; note it's the only path exempt from `PROXY_ENFORCE`.
- `docs/agents/architecture/proxy.md` "Signed client IP": `X-Proxy-Secret` now also gates
  `X-Forwarded-Host` and statistics, with an optional 403 enforcement.
- `docs/agents/security-guidelines/insecure-headers.md` (or the closest existing file): one
  rule saying a forwarded header (`X-Forwarded-*`) may only be trusted when
  `request.via_proxy` is true.

## Files to Change

- `docs/agents/statistics.md`
- `docs/agents/access-control/game.md`
- `docs/agents/access-control/endpoints.md`
- `docs/agents/architecture/proxy.md`
- `docs/agents/security-guidelines/insecure-headers.md`
