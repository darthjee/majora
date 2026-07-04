# Translator Plan: Add photo index pages for games and characters

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<key>')` for every new
user-visible string introduced by this issue and will not hardcode English
text. Add the corresponding keys to every existing locale file under
`frontend/assets/i18n/` (currently `en.yaml`; keep all locale files in sync,
per the key-parity check run by `npm run check_i18n`).

## Implementation Steps

### Step 1 — Add a "see all photos" link key to the existing show-page namespaces

- `game_page.see_all_photos` (near the existing `game_page.treasures` key in
  `en.yaml`) — link text on the game show page pointing to the new
  `#/games/:game_slug/photos` route.
- `character_page.see_all_photos` (near `character_page.edit`) — link text
  on the PC/NPC show pages pointing to the new
  `#/games/:game_slug/pcs|npcs/:id/photos` route.

### Step 2 — Add namespaces for the three new index pages

Follow the `namespace.key` convention (one namespace per page, matching
`GameTreasuresHelper`'s use of `game_treasures_page.*`). Add:

```yaml
game_photos_page:
  title: Photos
  loading: Loading photos...
  upload: Upload photo
pc_character_photos_page:
  title: Photos
  loading: Loading photos...
  upload: Upload photo
npc_character_photos_page:
  title: Photos
  loading: Loading photos...
  upload: Upload photo
```

Coordinate with the `frontend` agent on the exact key names it ends up using
in `<Name>Helper.jsx` (`renderLoading()`/upload button/page title) — if the
three pages' copy is identical, a single shared namespace (e.g.
`photos_page`) may be simpler than three near-duplicate namespaces; pick
whichever the `frontend` agent's implementation actually references, and
keep this file's key names in lockstep with the `Translator.t()` calls it
adds.

### Step 3 — Verify key parity

Run the key-parity check across every locale file after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the keys above (and to every other
  locale file present at implementation time)

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This file's key names are a starting proposal — the `frontend` agent's
  actual `Translator.t()` calls are the source of truth; update this list if
  it diverges during implementation.
