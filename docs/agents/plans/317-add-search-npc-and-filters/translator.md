# Translator Plan: Add search NPC and filters

Main plan: [plan.md](plan.md)

## Shared contracts

`frontend` will call `Translator.t('game_npcs_page.<key>')` for the new NPC filter bar
(Status dropdown, Name input, Query button, Clear button). The following keys must exist,
with matching structure, in both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, nested under the existing `game_npcs_page:` block:

- `filter_status_label`
- `filter_status_alive`
- `filter_status_slain`
- `filter_name_label`
- `filter_name_placeholder`
- `filter_query`
- `filter_clear`

## Implementation Steps

### Step 1 — Add English keys

In `frontend/assets/i18n/en.yaml`, under the existing `game_npcs_page:` block (currently
`loading`, `title`, `new_npc`), add:

```yaml
game_npcs_page:
  loading: Loading...
  title: Non-Player Characters
  new_npc: New NPC
  filter_status_label: Status
  filter_status_alive: Alive
  filter_status_slain: Slain
  filter_name_label: Name
  filter_name_placeholder: Search by name...
  filter_query: Query
  filter_clear: Clear
```

### Step 2 — Add Portuguese keys

In `frontend/assets/i18n/pt.yaml`, under the same `game_npcs_page:` block, add the matching
translated keys, e.g.:

```yaml
game_npcs_page:
  loading: Carregando...
  title: NPCs
  new_npc: Novo NPC
  filter_status_label: Status
  filter_status_alive: Vivo
  filter_status_slain: Morto
  filter_name_label: Nome
  filter_name_placeholder: Buscar por nome...
  filter_query: Filtrar
  filter_clear: Limpar
```

### Step 3 — Verify key parity

Run the key-parity check script to confirm both files stay in sync:

```bash
docker-compose run --rm frontend npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add 7 new keys under `game_npcs_page`.
- `frontend/assets/i18n/pt.yaml` — add matching 7 new keys under `game_npcs_page`.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `checks`) — run via `docker-compose run` against the frontend service.

## Notes

- Coordinate exact key names with whatever `frontend` actually references in
  `NpcFiltersHelper.jsx` — if it diverges slightly during implementation, keep both yaml
  files and the component in sync.
