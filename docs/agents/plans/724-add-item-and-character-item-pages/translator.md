# Translator Plan: Add Item and Character Item pages

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<key>')` for every new user-visible string on the
three new item detail pages and will not hardcode English text. Add the corresponding keys to
every existing locale file under `frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml`; keep
all locale files in sync, per the key-parity check run by `npm run check_i18n`).

## Implementation Steps

### Step 1 — Add a shared `item_page` namespace

Following the `namespace.key` convention (one namespace per page, or per closely-related group of
pages — matching `player_page`'s precedent for the recent, structurally similar single-detail
page from issue #695). Since all three item detail pages (game/PC/NPC) share one render helper
(`ItemDetailHelper.jsx`) and identical copy, a single shared namespace is simplest:

```yaml
item_page:
  loading: Loading item...
  hidden_label: Hidden
```

`hidden_label` mirrors the existing `game_items_page.hidden_label`/`character_items_page.hidden_label`
keys already used by the list cards' Hidden badge (`ItemCardHelper.buildInfoBarItems`), reused here
for the same badge on the detail page's photo.

### Step 2 — Verify key parity

Run the key-parity check across every locale file (`en.yaml`, `pt.yaml`) after adding the keys,
and provide a Portuguese translation for `pt.yaml` (not just a copy of the English strings).

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the `item_page` namespace above.
- `frontend/assets/i18n/pt.yaml` — add the same keys, translated to Portuguese.

## CI Checks

- `frontend`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This file's key names are a starting proposal — the `frontend` agent's actual `Translator.t()`
  calls in `ItemDetailHelper.jsx` are the source of truth; update this list (and add any
  additional keys, e.g. an error message) if the frontend implementation ends up needing more
  than `loading`/`hidden_label`, or diverges into per-kind namespaces instead of one shared one.
