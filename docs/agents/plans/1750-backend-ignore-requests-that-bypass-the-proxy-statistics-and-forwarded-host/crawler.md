# Crawler Plan: Backend: ignore requests that bypass the proxy (statistics and forwarded host)

Main plan: [plan.md](plan.md)

## Shared contracts

- `MAJORA_API_BASE_URL` must be the public site URL served by the proxy, never the backend's
  direct hostname. Locally that's the Tent proxy (`http://localhost:3000`), not `majora_app`
  (`http://localhost:3030`).

## Implementation Steps

### Step 1 — Document the base URL rule

In `crawler/RUNNING.md`, change the `MAJORA_API_BASE_URL` example to the proxy URL
(`http://localhost:3000` locally) and add a note that it must point at the proxy, never the
backend directly: direct calls are untrusted and, once enforcement is on in production
(#1768), rejected with 403. Mirror the note in `docs/agents/crawler.md` if it documents the
variable. Docs only, no code change.

## Files to Change

- `crawler/RUNNING.md` — example value and note.
- `docs/agents/crawler.md` — matching note, if the variable is documented there.
