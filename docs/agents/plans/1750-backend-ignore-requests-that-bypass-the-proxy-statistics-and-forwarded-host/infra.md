# Infra Plan: Backend: ignore requests that bypass the proxy (statistics and forwarded host)

Main plan: [plan.md](plan.md)

## Shared contracts

- New backend env var `PROXY_ENFORCE`: `'true'` enables 403 rejection of requests without a
  valid `X-Proxy-Secret` (exempt: exactly `/ready.json`). Default off. Turning it on in
  production is #1768, not this issue.
- `PROXY_SECRET` stays a single value. A mismatch now breaks domain resolution, and with
  enforcement on it returns 403 for everything.

## Implementation Steps

### Step 1 — Production configuration docs

In `docs/agents/production-configuration.md`:

- Add a `PROXY_ENFORCE` row to the backend env var table: off by default, enables the 403,
  `/ready.json` exempt, only to be turned on after confirming every caller uses the proxy URL
  (#1768).
- Update "Pairing rule": an empty value or a mismatch makes every request untrusted, so it isn't
  tracked in statistics, `X-Forwarded-Host` is ignored (no domain resolves: `/games.json` returns
  404 `domain_not_recognized`), and with `PROXY_ENFORCE=true` it gets a 403. Update the "Only
  statistics use this IP" line accordingly.
- Update the backend guards: add the new startup warning for `PROXY_ENFORCE=true` with an
  empty `PROXY_SECRET`.
- Rewrite "Rotating the secret": the window between updating the proxy and redeploying the
  backend is **no longer harmless**. Update both sides back to back, preferably at low
  traffic, and expect a short disruption (domain-scoped pages fail, or everything gets a 403
  once enforcement is on). Add a deploy note: before deploying #1750, confirm `PROXY_SECRET`
  is set on the backend (otherwise the change is a silent no-op).

### Step 2 — Dev env sample

In `.env.dev.sample`, extend the `PROXY_SECRET` comment: Django now also ignores
`X-Forwarded-Host` and skips statistics for requests without the header, so direct calls to
`majora_app` (`localhost:3030`) are untrusted. Add a commented-out `# PROXY_ENFORCE=false`
with a one-line explanation. Use placeholder values only.

## Files to Change

- `docs/agents/production-configuration.md` — env table, pairing rule, guards, rotation.
- `.env.dev.sample` — comments and the `PROXY_ENFORCE` placeholder.

## Notes

- No real hostnames, IPs or secrets: the repository is public.
