# Translator Plan: Add item list

Main plan: [plan.md](plan.md)

## Shared contracts

Add the i18n keys listed in [plan.md](plan.md)'s "Shared contracts" section, under the exact
namespaces the frontend will reference. Do not wait for the frontend implementation to land —
these names are fixed by the shared contract; add them proactively so frontend work isn't
blocked on translations.

## Implementation Steps

### Step 1 — Add English strings

In `frontend/assets/i18n/en.yaml`, add (placing each near its treasure counterpart for
discoverability, e.g. `character_items_preview` near `character_treasures_preview`):

```yaml
character_items_preview:
  empty: No items yet.
character_page:
  items_title: Items
character_items_page:
  loading: Loading items...
  title: Items
game_items_page:
  loading: Loading items...
  title: Items
```

(`character_page` already exists — add `items_title` as a new key inside it, alongside the
existing `treasures_title`.)

### Step 2 — Add Portuguese strings

Mirror the same keys/structure in `frontend/assets/i18n/pt.yaml` with Portuguese translations.

### Step 3 — Verify sync

Run the translation-key sync check script (see `AGENTS.md`/translator agent scope for the
exact script name) to confirm `en.yaml` and `pt.yaml` stay in sync.

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`

## Notes

- If the frontend implementation ends up needing additional keys beyond this list (e.g. an
  empty-state message on the new list pages themselves, distinct from the preview's empty
  text), add them following the same naming convention as the equivalent treasure keys.
