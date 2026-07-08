# Improve NPC allegiance FE

## Context

NPC allegiance already exists end-to-end on the backend: the `Character` model has `allegiance` (DM-only value) and `public_allegiance` (player-visible value) fields, both `ally`/`enemy`/`neutral`, defaulting to `neutral`. Both `/games/:game_slug/npcs/all.json` (DM view) and `/games/:game_slug/npcs.json` (public view) already accept an `allegiance` query param and filter on the correct underlying field per endpoint. The NPC picture border already reflects allegiance read-only.

What is still missing is exposing this on the frontend, plus one small backend gap on creation:

- NPC creation and edit forms have no way to set allegiance or public allegiance — both are stuck at the model default (`neutral`) forever.
- The NPC index page has no allegiance filter, even though the backend already supports filtering by it on both endpoints.
- `CharacterCreateSerializer` does not accept `allegiance`/`public_allegiance` at all, so even once a creation form sends them, the backend would silently ignore them (the edit serializer, `CharacterUpdateSerializer`, already accepts both).

## What needs to be done

Backend:
- Add `allegiance` and `public_allegiance` to `CharacterCreateSerializer` (`source/games/serializers/character_create.py`), matching how `CharacterUpdateSerializer` already exposes them, so the NPC creation endpoint accepts and persists both fields.

Frontend — NPC creation form (`GameNpcNew.jsx` / `GameNpcNewHelper.jsx`, `GameNpcNewController.js`):
- Add an "Allegiance" select and a "Public Allegiance" select (Ally/Enemy/Neutral), both defaulting to Neutral, and include both in the create submit payload.

Frontend — NPC edit form (NPC-only; the PC edit form is unaffected since allegiance is not a PC concept):
- Add the same two selects to `NpcCharacterEditHelper.jsx`'s rendering. Since `BaseCharacterEditHelper`/`CharacterEdit.jsx` are shared between NPC and PC edit pages, this needs to be done in a way that only renders (and only submits) the allegiance fields for the NPC variant — e.g. gating on `characterKind`/`idPrefix`, or lifting the two fields into an NPC-specific override — without adding them to the PC edit form.
- Seed the selects from the loaded character's existing `allegiance`/`public_allegiance` values, and include both in the update submit payload.

Frontend — NPC index filter (`NpcFilters.jsx`, `NpcFiltersHelper.jsx`, `NpcFiltersController.js`):
- Add a single "Allegiance" `<select>` (blank/Ally/Enemy/Neutral) next to the existing Status filter, following the same pattern. It builds one `allegiance` query param, which `GameNpcsController.js` already forwards unchanged to both `/npcs/all.json` and `/npcs.json` — the backend maps it to the right field (`allegiance` vs `public_allegiance`) per endpoint automatically, so no separate "public allegiance" filter is needed.

i18n:
- Add new translation keys (labels for the Allegiance/Public Allegiance fields and the Ally/Enemy/Neutral option labels) to `frontend/assets/i18n/en.yaml` and `pt.yaml` — none currently exist for these values.

## Acceptance criteria

- [ ] `CharacterCreateSerializer` accepts and persists `allegiance` and `public_allegiance` on NPC creation.
- [ ] The NPC creation form includes Allegiance and Public Allegiance selects (Ally/Enemy/Neutral, defaulting to Neutral) and submits both values.
- [ ] The NPC edit form includes the same two selects, seeded from the loaded character, without affecting the PC edit form.
- [ ] The NPC index filter includes an Allegiance select that filters both the DM (`npcs/all.json`) and public (`npcs.json`) NPC lists via the existing `allegiance` query param.
- [ ] New i18n keys for the Allegiance/Public Allegiance labels and Ally/Enemy/Neutral option labels are added to `en.yaml` and `pt.yaml`.

---
Tags: :shipit:
