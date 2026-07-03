# Plan: Add money to character

Issue: [271-add-money-to-character.md](../issues/271-add-money-to-character.md)

## Overview

Add a non-negative integer `money` field to `Character` (stored in copper pieces), expose it
on the read and update serializers, and render it on the frontend as a cascading
platinum/gold/silver/copper/gems breakdown component on the character show page, plus a plain
numeric input on the shared character edit form. Coin/denomination translation strings are
added to both locales.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API field: `Character.money`

- New model field `money` on `Character`: `models.PositiveIntegerField(default=0)` (same
  non-negative pattern already used for `object_id` on `Link`/`Upload`). Django's
  `PositiveIntegerField` carries a `MinValueValidator(0)`, which DRF's `ModelSerializer`
  automatically turns into `min_value=0` on the generated serializer field, rejecting
  negative values with a `400` and `errors.money: ["Ensure this value is greater than or
  equal to 0."]`-style payload — the same envelope shape already used for other field
  errors (see `errors` handling in `BaseCharacterEditController#handleResponse`).
- **Read**: `money` (integer) is added to `CharacterDetailSerializer.Meta.fields`. Because
  `CharacterFullSerializer` inherits `CharacterDetailSerializer.Meta.fields`, it is
  automatically included there too — matching the "same visibility as `public_description`/
  photos, no restriction" requirement. It is intentionally **not** added to
  `CharacterListSerializer` (only the show page renders the breakdown).
- **Write**: `money` is added to `CharacterUpdateSerializer.Meta.fields`, `required: False`
  (same pattern as the other fields in that serializer, via the existing
  `extra_kwargs = {field: {'required': False} for field in fields}` comprehension).
- Frontend sends `money` as a JSON integer, converted from the raw form string via
  `parseInt(formValues.money, 10)` before the PATCH request — same pattern already used by
  `TreasureEditController#submitForm` for `Treasure.value`.

### Translation keys (added to both `en.yaml` and `pt.yaml`, under a new `money` top-level key)

```
money:
  platinum_coin: "platinum coin(s)" / "moeda(s) de platina"
  gold_coin: "gold coin(s)" / "moeda(s) de ouro"
  silver_coin: "silver coin(s)" / "moeda(s) de prata"
  copper_coin: "copper coin(s)" / "moeda(s) de cobre"
  platinum_piece: "platinum piece(s)" / "peça(s) de platina"
  gold_piece: "gold piece(s)" / "peça(s) de ouro"
  silver_piece: "silver piece(s)" / "peça(s) de prata"
  copper_piece: "copper piece(s)" / "peça(s) de cobre"
  gems: "gems" / "gemas"
  gp_in_gems: "GP in gems" / "PO em gemas"
  pp_abbreviation: "PP" / "PL"
  gp_abbreviation: "GP" / "PO"
  sp_abbreviation: "SP" / "PP"
  cp_abbreviation: "CP" / "PC"
```

Plus one new label key per character edit namespace, following the existing
`name_label`/`role_label` convention:

```
pc_edit_page.money_label: "Money (copper pieces)" / "Dinheiro (peças de cobre)"
npc_edit_page.money_label: "Money (copper pieces)" / "Dinheiro (peças de cobre)"
```

`Translator.t(key)` is a plain dot-path lookup with **no interpolation or pluralization
support** (see `frontend/assets/js/i18n/Translator.js`) — the frontend money-breakdown
component builds each line by concatenating the numeric quantity with the translated
abbreviation in JS (e.g. `` `${quantity} ${Translator.t('money.cp_abbreviation')}` ``), it
does not pass the quantity through `t()`.

## Notes

- No new endpoint, no change to auth/permission logic — `money` reuses the exact
  visibility/editability of `public_description`. A `data-access` review is still triggered
  automatically after the backend PR (new serializer field), per the project's standard
  flow.
