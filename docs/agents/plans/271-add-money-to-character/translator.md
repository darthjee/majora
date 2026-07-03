# Translator Plan: Add money to character

Main plan: [plan.md](plan.md)

## Shared contracts

Add exactly these keys to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, under a new top-level `money` map:

| Key (under `money:`) | English | Portuguese |
|---|---|---|
| `platinum_coin` | platinum coin(s) | moeda(s) de platina |
| `gold_coin` | gold coin(s) | moeda(s) de ouro |
| `silver_coin` | silver coin(s) | moeda(s) de prata |
| `copper_coin` | copper coin(s) | moeda(s) de cobre |
| `platinum_piece` | platinum piece(s) | peça(s) de platina |
| `gold_piece` | gold piece(s) | peça(s) de ouro |
| `silver_piece` | silver piece(s) | peça(s) de prata |
| `copper_piece` | copper piece(s) | peça(s) de cobre |
| `gems` | gems | gemas |
| `gp_in_gems` | GP in gems | PO em gemas |
| `pp_abbreviation` | PP | PL |
| `gp_abbreviation` | GP | PO |
| `sp_abbreviation` | SP | PP |
| `cp_abbreviation` | CP | PC |

Plus one new key inside each of the two existing character-edit namespaces:

| Namespace | Key | English | Portuguese |
|---|---|---|---|
| `pc_edit_page` | `money_label` | Money (copper pieces) | Dinheiro (peças de cobre) |
| `npc_edit_page` | `money_label` | Money (copper pieces) | Dinheiro (peças de cobre) |

These exact key names are what the `frontend` agent's `Translator.t('money.cp_abbreviation')`
etc. calls (see [frontend.md](frontend.md)) will look up — do not rename them without
coordinating.

## Implementation Steps

### Step 1 — Add the `money` block

In `frontend/assets/i18n/en.yaml`, add a new top-level `money:` map with the 14 keys above,
in the same style/indentation as existing top-level maps (e.g. `character_info:`,
`character_page:`). Repeat in `frontend/assets/i18n/pt.yaml` with the Portuguese values from
the table.

### Step 2 — Add `money_label` to the edit-page namespaces

In both `en.yaml` and `pt.yaml`, add `money_label` under the existing `pc_edit_page:` and
`npc_edit_page:` blocks, following the existing `name_label`/`role_label` key ordering
convention (append after the existing keys in each block, or alongside them if there's a
more natural spot — check current key order in both files before deciding).

### Step 3 — Verify key parity

```
docker-compose run majora_fe npm run check_i18n
```

(Confirm the exact service name against `docker-compose.yml`; never invoke `node`/`npm`
directly on the host.) This script enforces that every key present in `en.yaml` is also
present in `pt.yaml` and vice versa — run it after editing both files to catch any typo or
omission.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `money:` block and `money_label` in both edit-page namespaces.
- `frontend/assets/i18n/pt.yaml` — same, in Portuguese.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Coordinate key names with the `frontend` agent before/while it wires up `Translator.t()`
  calls — the table above is the single source of truth for exact key spelling.
