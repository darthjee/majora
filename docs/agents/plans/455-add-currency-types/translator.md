# Translator Plan: Add currency types

Main plan: [plan.md](plan.md)

## Shared contracts

- New keys are added to the existing `money:` namespace in both
  `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`
  (`frontend/assets/i18n/en.yaml:370-384`), alongside the current `cp_abbreviation`/
  `sp_abbreviation`/`gp_abbreviation`/`pp_abbreviation`/`gems`/`gp_in_gems` keys.
- The `frontend` agent's `DeadlandsMoneyModel`/`CharacterMoneyHelper`/`TreasureMoneyHelper`
  work (see `frontend.md` Step 2) calls these by name — keep the key names exactly as
  listed below.
- If the standalone treasure creation form's new currency-type dropdown (`frontend.md`
  Step 5) needs a field label key, it's `treasure_new_page.game_type_label` (or the
  equivalent existing namespace for that page — confirm the exact namespace name against
  whatever `frontend` names it), matching the `game_new_page.game_type_label` precedent
  from #454. The dropdown's own option text ("D&D"/"Deadlands") stays untranslated, same
  as #454.

## Implementation Steps

### Step 1 — Add Deadlands denomination abbreviation keys

In `frontend/assets/i18n/en.yaml`'s `money:` block, add:

```yaml
  cents_abbreviation: Cents
  dollars_abbreviation: Dollars
```

placed after the existing `pp_abbreviation`/`gp_abbreviation`/`sp_abbreviation`/
`cp_abbreviation` keys, matching the existing style (`money.gp_in_gems` and friends).
Confirm with the `frontend` agent's actual key names for
`DeadlandsMoneyModel.labelKey()` before finalizing, since those must match exactly.

### Step 2 — Add the standalone treasure creation dropdown label

Add `game_type_label` under whichever i18n namespace `frontend.md` Step 5 uses for
`TreasureNewHelper.jsx` (check the existing namespace used by that page's other labels,
e.g. `treasure_new_page:` if one exists, or confirm the exact key with the `frontend`
agent), following the same field-label wording style as `game_new_page.game_type_label`
from #454 (e.g. "Currency type" or "Game type" — pick whichever reads better next to the
existing `name`/`value` labels on that form).

### Step 3 — Add the matching `pt.yaml` keys

Add the Portuguese equivalents for every key added in Steps 1–2, in the same positions,
so both locale files stay structurally in sync.

### Step 4 — Verify sync

Run the translation-key sync check to confirm both files stay aligned.

## CI Checks

- `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Do not add translation keys for the dropdown's option text itself ("D&D"/"Deadlands") —
  per the issue, those stay hardcoded and untranslated, same as #454.
- Coordinate the exact `cents_abbreviation`/`dollars_abbreviation` key names with whatever
  the `frontend` agent's `DeadlandsMoneyModel.labelKey()` implementation actually looks
  up, since a mismatch would silently render missing-translation output rather than fail
  a build.
