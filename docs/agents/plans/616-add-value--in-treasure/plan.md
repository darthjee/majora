# Plan: Add value "in treasure"

Issue: [616-add-value--in-treasure.md](../issues/616-add-value--in-treasure.md)

## Overview

Surface the character's already-serialized `treasure_value` field on the PC/NPC show and edit
pages, inside the existing Money component. D&D renders it as an extra bright-red coin box
(cascading CP/SP/GP breakdown of non-zero denominations, joined with `" | "`, suffixed with an
"in Gems" label). Deadlands renders it as a separate gold/white box below the money box (`$
dollars,cents`, same suffix). The value is hidden entirely when 0, and is display-only — no
edit affordance is added in this issue.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

One new i18n key, added by `translator` and consumed by `frontend`:

- `money.in_gems`
  - English: `in Gems`
  - Portuguese: `em Gemas`

Used verbatim (not per-denomination) as a suffix appended once at the end of the D&D treasure
breakdown line, and once inside the Deadlands treasure box, after the amount.

No backend changes are needed: `treasure_value` is already present on the PC/NPC detail API
response (`backend/games/serializers/characters/character_detail.py`, resolved via
`backend/games/serializers/characters/_treasure_value.py`), expressed in the same lowest
denomination as `money` (copper pieces for `dnd`, cents for `deadlands`).
