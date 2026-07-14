# Translator Plan: Add resilience on 502 and timeout

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent adds three new keys under the `header:` namespace of
`frontend/assets/i18n/en.yaml`:

- `resilience_idle_alt`
- `resilience_requesting_alt`
- `resilience_retrying_alt`

These are alt-text labels for a new header status icon (idle / requesting / retrying —
green/yellow/red lightning/hourglass icons indicating whether a resilient request is
currently retrying after a `502`/timeout). This agent's job is to mirror the same three
keys, in the same `header:` namespace, into `frontend/assets/i18n/pt.yaml`, once the
English keys exist (coordinate with/wait for the frontend agent's change if working in
parallel).

## Implementation Steps

### Step 1 — Add the missing keys to `pt.yaml`

Add `resilience_idle_alt`, `resilience_requesting_alt`, `resilience_retrying_alt` under the
`header:` section of `frontend/assets/i18n/pt.yaml`, translating the English source
(`Idle` / `Requesting` / `Retrying`) into natural Portuguese, consistent with the tone of
the other existing `header:` entries in that file.

### Step 2 — Verify sync

Run the translation-key sync check to confirm no keys are missing/extra across languages.

## Files to Change

- `frontend/assets/i18n/pt.yaml` — add the three new `header.resilience_*_alt` keys.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This agent should not need to touch `en.yaml` — that's the frontend agent's change. If
  `en.yaml` doesn't have the keys yet when this runs, wait for/re-check that dependency
  rather than inventing the English source text.
