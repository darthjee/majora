# Translator Plan: Character tool tip

Main plan: [plan.md](plan.md)

## Shared contracts

`frontend` will call `Translator.t('character_status_badges.<key>')` for each of the keys below — these keys and English text are final; add them exactly as given.

## Implementation Steps

### Step 1 — Add the new namespace to `en.yaml`

In `frontend/assets/i18n/en.yaml`, add a new `character_status_badges` namespace (following the existing `character_page`/`character_info` namespace convention already in that file, e.g. placed near `character_info:`):

```yaml
character_status_badges:
  slain: Slain
  alive: Alive
  public_slain: Known as Slain
  public_alive: Known as Alive
  enemy: Enemy
  ally: Ally
  neutral: Neutral
  public_enemy: Known as Enemy
  public_ally: Known as Ally
  public_neutral: Known as Neutral
```

### Step 2 — Verify

Run the key-sync check:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Since `en.yaml` is (as of this issue) the only bundled locale file, this should pass trivially, but run it anyway to confirm no other locale file exists that would now be missing these keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the `character_status_badges` namespace.

## Notes

- This can be done independently of and in parallel with the `frontend` agent's work — `Translator.t()` falls back to the raw key when a key is missing, so `frontend` isn't blocked waiting on this.
- Do not touch any other part of `frontend/` (components, controllers, helpers, specs) — that's `frontend`'s scope per this project's agent boundaries.
