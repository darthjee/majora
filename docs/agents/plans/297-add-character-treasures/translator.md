# Translator Plan: Add character treasures

Main plan: [plan.md](plan.md)

## Shared contracts

- Frontend consumes exactly the keys listed below — do not rename them without checking
  back with [frontend.md](frontend.md).
- Two bundled languages exist today: `frontend/assets/i18n/en.yaml` and
  `frontend/assets/i18n/pt.yaml`. Both must get the new keys (the `check_i18n` CI check
  enforces key parity across all bundled languages).

## Implementation Steps

### Step 1 — Add the preview-section heading key

Add one new key under the existing `character_page:` namespace in both files (do not
duplicate `character_preview_section.see_all` — that key is reused as-is, unchanged):

`en.yaml`:
```yaml
character_page:
  treasures_title: Treasures
```

`pt.yaml`:
```yaml
character_page:
  treasures_title: Tesouros
```

### Step 2 — Add the full list page namespace

Add a new `character_treasures_page:` namespace to both files, placed near the existing
`game_treasures_page:` block for discoverability:

`en.yaml`:
```yaml
character_treasures_page:
  loading: Loading treasures...
  title: Treasures
  name_column: Name
  quantity_column: Quantity
  value_column: Value
```

`pt.yaml`:
```yaml
character_treasures_page:
  loading: Carregando tesouros...
  title: Tesouros
  name_column: Nome
  quantity_column: Quantidade
  value_column: Valor
```

### Step 3 — Verify key parity

Run the parity checker to confirm both files stay in sync:

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — `character_page.treasures_title`,
  `character_treasures_page.*`
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese values

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job:
  `frontend-checks`)

## Notes

- If `frontend.md`'s Step 6 ends up naming the full-list page/route differently (e.g. a
  shared component rather than Pc/Npc split), the namespace name
  `character_treasures_page` still applies to both PC and NPC variants — no separate
  `pc_`/`npc_` prefixed keys are needed, mirroring how `character_page`/`character_full_page`
  are already shared between PC and NPC character detail pages.
