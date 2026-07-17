# Translator Plan: Add filters in treasures page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the new keys under the existing `treasures_page` namespace listed in [plan.md](plan.md), consumed by [frontend](frontend.md)'s new `TreasureFiltersHelper.jsx` via `Translator.t('treasures_page.<key>')`:
`filter_game_type_label`, `filter_min_value_label`, `filter_max_value_label`, `filter_name_label`, `filter_name_placeholder`, `filter_query`, `filter_clear`.

The literal "D&D"/"Deadlands" option text is NOT part of this namespace — it stays hardcoded in JSX per the existing `TreasureNewHelper.jsx` convention, so no key is needed for it.

## Implementation Steps

### Step 1 — Add the new keys to both locale files

In `frontend/assets/i18n/en.yaml`, extend the existing `treasures_page:` block (currently `loading`/`new_treasure`, around line 189) with:

```yaml
treasures_page:
  loading: Loading treasures...
  new_treasure: New Treasure
  filter_game_type_label: Game type
  filter_min_value_label: Min value
  filter_max_value_label: Max value
  filter_name_label: Name
  filter_name_placeholder: Search by name...
  filter_query: Query
  filter_clear: Clear
```

Wording for `filter_name_label`/`filter_name_placeholder`/`filter_query`/`filter_clear` matches the equivalent `game_npcs_page.filter_*` English strings exactly (`Name`, `Search by name...`, `Query`, `Clear`), for consistency across filter bars in the app.

In `frontend/assets/i18n/pt.yaml`, extend the same block with natural Portuguese translations, following this app's existing `game_npcs_page` Portuguese equivalents (`filter_name_label: Nome`, `filter_name_placeholder: Buscar por nome...`, `filter_query: Filtrar`, `filter_clear: Limpar`):

```yaml
treasures_page:
  loading: Carregando tesouros...
  new_treasure: Novo Tesouro
  filter_game_type_label: Tipo de jogo
  filter_min_value_label: Valor mínimo
  filter_max_value_label: Valor máximo
  filter_name_label: Nome
  filter_name_placeholder: Buscar por nome...
  filter_query: Filtrar
  filter_clear: Limpar
```

### Step 2 — Verify key sync

Run the repo's translation-key-sync check to confirm every key added to `en.yaml` has a matching `pt.yaml` entry (and vice versa).

## Files to Change

- `frontend/assets/i18n/en.yaml` — add 7 keys to `treasures_page`.
- `frontend/assets/i18n/pt.yaml` — add 7 keys to `treasures_page`.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No new namespace is created — all new keys live under the existing `treasures_page` namespace, since the filter bar lives on the existing treasures list page.
