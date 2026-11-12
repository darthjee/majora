# Client Plan: Backend: ignore requests that bypass the proxy (statistics and forwarded host)

Main plan: [plan.md](plan.md)

## Shared contracts

- `MAJORA_URL` / `baseUrl` must be the public site URL served by the proxy, never the
  backend's direct hostname. Direct backend calls are untrusted and, once `PROXY_ENFORCE` is on
  in production (#1768), rejected with `403 {"detail": "Forbidden"}`.

## Implementation Steps

### Step 1 — Document the base URL rule

Add a short note wherever `baseUrl` / `MAJORA_URL` is introduced: it must be the public Majora
URL (through the proxy), not the backend service's own hostname. A direct backend URL gives
403s once enforcement is on. Docs only, no code change.

## Files to Change

- `client/README.md` — note next to the `baseUrl` example.
- `docs/guides/client.md` — note next to the `baseUrl` / `MAJORA_URL` examples.
- `docs/agents/client/library.md` — note on the `MAJORA_URL` fallback.

## Notes

- Use `https://majora.example.com`-style placeholders only.
