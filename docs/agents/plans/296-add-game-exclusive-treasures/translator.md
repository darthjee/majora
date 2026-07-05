# Translator Plan: Add game-exclusive treasures

Main plan: [plan.md](plan.md)

## Shared contracts

`frontend` needs new user-facing strings for: a "New Treasure" button on the game treasures
page, an "Edit" action on each treasure card, and two new pages (game-scoped treasure creation
and edit), mirroring the existing global `treasures_page`/`treasure_page`/`treasure_new_page`/
`treasure_edit_page` namespaces already in `frontend/assets/i18n/en.yaml`.

## Implementation Steps

### Step 1 — Add new keys to `frontend/assets/i18n/en.yaml`

Extend the existing `game_treasures_page` namespace with a "new treasure" button label and an
"edit" action label (mirroring `treasures_page.new_treasure` and `treasure_page.edit`):

```yaml
game_treasures_page:
  loading: Loading treasures...
  title: Treasures
  treasures: Treasures
  new_treasure: New Treasure
  edit: Edit
```

Add two new namespaces mirroring `treasure_new_page` and `treasure_edit_page` exactly (same
keys, same copy, since the form fields are identical — only the submission target differs):

```yaml
game_treasure_new_page:
  title: New Treasure
  name_label: Name
  value_label: Value
  submit: Create
  error: Failed to create treasure. Please try again.
game_treasure_edit_page:
  title: Edit Treasure
  name_label: Name
  value_label: Value
  submit: Save
  error: Failed to save treasure. Please try again.
```

(Check the exact existing `treasure_new_page`/`treasure_edit_page` block in `en.yaml` for the
precise key set and copy — e.g. confirm the `submit` key name and label wording — and mirror it
exactly rather than the illustrative values above.)

### Step 2 — Verify key parity

Since only `en.yaml` currently exists (per `docs/agents/i18n.md`, no other language is bundled
yet), there is no cross-language parity check to run today. Still, run whatever key-parity
script/check this project has configured (see `docs/agents/i18n.md` and any script under
`frontend/` referenced by CI) to confirm nothing is left inconsistent.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_treasures_page.new_treasure`,
  `game_treasures_page.edit`, `game_treasure_new_page.*`, `game_treasure_edit_page.*`

## CI Checks

- `frontend/`: whichever job/script validates i18n key parity (see `docs/agents/i18n.md`) — run
  locally via `docker-compose run` if one exists; otherwise this is a data-only YAML change
  covered indirectly by the `frontend` agent's Jasmine specs that assert on the new
  `Translator.t()` calls.

## Notes

- Keep copy consistent with the existing global treasure pages' wording — these are the same
  form, just scoped to a game, so there is no reason for the labels to read differently.
