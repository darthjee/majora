# Infra Plan: Client IP integrity: backend directly reachable and X-Forwarded-For trusted as-is

Main plan: [plan.md](plan.md)

## Shared contracts

- `PROXY_SECRET` must reach both `majora_app` (Django) and `majora_proxy` (Tent) in dev. Both services already load `env_file: .env`, so declaring it in `.env.dev.sample` is enough.

## Implementation Steps

### Step 1 — Declare `PROXY_SECRET` for dev
Add `PROXY_SECRET=dev-proxy-secret` to `.env.dev.sample`, next to `STATISTICS_SKIP_SECRET`, with a short comment: it is shared by Tent and Django, and Django trusts `X-Forwarded-For` only when the secret matches. Confirm that `majora_app` and `majora_proxy` in `docker-compose.yml` both get it through `env_file: .env`. If a service only uses an explicit `environment:` list, add it there.

## Files to Change
- `.env.dev.sample`: `PROXY_SECRET`.
- `docker-compose.yml`: only if a service that needs the variable doesn't load `.env`.

## Notes
- Production values are set by the owner outside the repo: the Render env var `PROXY_SECRET` and `$proxySecret` in the server-side Tent `locals.php`.
