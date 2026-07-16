# Translator Plan: Polls should show user avatar and show all votes

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('game_poll_page.votes_count_label')` next to
each poll option's vote count. Add this key to every existing locale file under
`frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml`), keeping them in parity per the
`npm run check_i18n` check.

## Implementation Steps

### Step 1 — Add the vote-count label key

Add to the existing `game_poll_page` namespace (`frontend/assets/i18n/en.yaml:348-363`,
alongside `winner_badge`/`close_button`):

```yaml
game_poll_page:
  votes_count_label: Votes
```

Add the matching Portuguese translation to `pt.yaml`'s `game_poll_page` namespace.

Coordinate with the `frontend` agent on the exact rendered format (e.g. `"Votes: 3"` vs. a
badge) — this file's key name is a starting proposal; keep it in lockstep with whatever
`Translator.t()` call the `frontend` agent's implementation ends up using.

### Step 2 — Verify key parity

Run the key-parity check after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_poll_page.votes_count_label`
- `frontend/assets/i18n/pt.yaml` — add `game_poll_page.votes_count_label`

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- If the `frontend` agent ends up needing additional copy (e.g. a "Voters" section heading
  distinct from the count label), add it here too — this plan only anticipates the one key
  called out in the issue's expected behavior (a per-option vote count).
