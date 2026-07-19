# Translator Plan: Add a My Games page

Main plan: [plan.md](plan.md)

## Shared contracts

Provides the i18n keys the `frontend` agent's code calls by name (see [plan.md](plan.md)'s
"Shared contracts" section). No need to coordinate timing — the key names are fixed by the shared
contract, so this can be done independently of the frontend agent's implementation.

## Implementation Steps

### Step 1 — Add new keys to `en.yaml`

Under the `header:` namespace, add:

```yaml
nav_my_games: "My Games"
```

Add a new `my_games:` namespace with:

```yaml
my_games:
  role_dm: "DM"
  role_player: "Player"
  following_tooltip: "Following {{count}} conversations"
  unread_tooltip: "{{count}} unread conversations"
```

`{{count}}` is a literal placeholder string, replaced client-side via `.replace('{{count}}', ...)`
— matches the existing convention used by `game_page.open_polls_count` and others (see
`frontend/assets/js/components/resources/game/pages/elements/helpers/OpenPollsWidgetHelper.jsx`).
Do not use any other interpolation syntax.

### Step 2 — Add matching keys to `pt.yaml`

Same keys, translated to Portuguese, keeping `{{count}}` literal and in a grammatically correct
position for Portuguese phrasing.

### Step 3 — Verify

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Fix any reported key mismatch between locale files before considering this done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `header.nav_my_games` and the `my_games` namespace.
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese text.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Coordinate the exact namespace/key names with what `frontend.md` actually calls if they drift
  during implementation — the names above are the contract, but implementation may adjust them;
  keep both sides in sync.
