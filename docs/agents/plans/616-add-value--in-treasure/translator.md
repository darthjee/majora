# Translator Plan: Add value "in treasure"

Main plan: [plan.md](plan.md)

## Shared contracts

Add one new key, consumed by the `frontend` agent as a single trailing suffix on both the D&D
treasure coin box and the Deadlands treasure box:

- `money.in_gems`
  - `en.yaml`: `in Gems`
  - `pt.yaml`: `em Gemas`

## Implementation Steps

### Step 1 — Add the new key

In `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, inside the existing
`money:` namespace (~line 446, next to `gems`/`gp_in_gems`), add:

```yaml
in_gems: in Gems       # en.yaml
in_gems: em Gemas      # pt.yaml
```

Do not reuse or rename the existing `gp_in_gems` key — it is unrelated (an overflow label for
the generic, non-dnd/deadlands cascading money breakdown) and must be left as-is.

### Step 2 — Verify keys stay in sync

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Fix any reported mismatch before considering the task done.

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`

## CI Checks

- `frontend`: `yarn check_i18n` (part of CI job: `frontend-checks`)

## Notes

- This is a single small, additive key — no restructuring of the `money:` namespace needed.
