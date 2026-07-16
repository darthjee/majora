# Translator Plan: Add Poll Voting

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the button labels/error copy needed by the frontend agent's vote controls (see
[frontend.md](frontend.md) Step 5) — no data flows the other way.

## Implementation Steps

### Step 1 — Add new `game_poll_page` keys
`frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` already have a `game_poll_page`
block (`en.yaml:341-344`: `loading`, `options_title`, `error`). Add, in both files, keeping key
order/style consistent with the existing block:
- `cast_vote`: singular submit-button label (`single`-type polls) — e.g. "Cast Vote" / "Votar".
- `cast_votes`: plural submit-button label (`multiple`-type polls) — e.g. "Cast Votes" / "Votar".
- `vote_error`: error message shown if casting a vote fails — e.g. "Failed to cast vote(s). Please
  try again." / equivalent Portuguese.

### Step 2 — Verify sync
Run the repo's i18n sync check to confirm `en.yaml`/`pt.yaml` stay key-for-key aligned.

## Files to Change
- `frontend/assets/i18n/en.yaml` — new `game_poll_page` keys.
- `frontend/assets/i18n/pt.yaml` — matching Portuguese keys.

## CI Checks
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`).

## Notes
- Coordinate the exact key names with the frontend agent's implementation if it ends up needing
  different/additional copy (e.g. a distinct disabled-state hint for admin viewers).
