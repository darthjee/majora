# Plan: Improve NPC allegiance FE

Issue: [387-improve-npc-allegiance-fe.md](../issues/387-improve-npc-allegiance-fe.md)

## Overview

NPC `allegiance`/`public_allegiance` (`ally`/`enemy`/`neutral`, default
`neutral`) already exist on the `Character` model, are already accepted by
`CharacterUpdateSerializer`, are already filterable via the `allegiance`
query param on both `/games/:slug/npcs/all.json` and `/games/:slug/npcs.json`,
and already drive the read-only picture border color. This plan closes the
remaining gaps: the NPC creation serializer doesn't accept the two fields
yet, and no frontend UI (creation form, edit form, or index filter) exposes
them at all. Backend adds the two fields to `CharacterCreateSerializer`;
frontend adds two selects to the NPC create/edit forms (NPC-only, since PC
has no allegiance concept) and one filter select to the NPC index; translator
adds the new labels/option keys both forms and the filter reference.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Serializer field addition (backend produces, frontend consumes)

`CharacterCreateSerializer` (`source/games/serializers/character_create.py`)
gains two optional fields, mirroring how `CharacterUpdateSerializer`
(`source/games/serializers/character_update.py`) already exposes them:

- `allegiance` — DM-only value, one of `ally`/`enemy`/`neutral`, defaults to
  `neutral` when omitted (model default, unchanged).
- `public_allegiance` — player-visible value, same enum/default.

Both are optional (`required: False`) on `POST /games/<slug>/npcs.json`,
exactly like `role`/`hidden`/`money` already are. No new endpoint, no
authorization change — the endpoint already requires `GameEditPermission`
for POST.

### Query param (already exists, no change — noted for context only)

`GET /games/<slug>/npcs/all.json` and `GET /games/<slug>/npcs.json` already
accept `?allegiance=ally|enemy|neutral`, mapping to `allegiance` (DM view)
or `public_allegiance` (public view) respectively. `GameNpcsController.js`
already forwards every filter param from the hash query string to both
fetches unchanged (`hashResolver.getFilterParams()`), so adding `allegiance`
to `NpcFiltersController#buildQuery`'s output is sufficient — no controller
change needed beyond that.

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

Add these keys, following the existing `filter_status_*`/`hidden_label`
naming convention:

`game_npc_new_page` (existing namespace, new keys):
```yaml
allegiance_label: Allegiance
public_allegiance_label: Public Allegiance
allegiance_ally: Ally
allegiance_enemy: Enemy
allegiance_neutral: Neutral
```

`npc_edit_page` (existing namespace, same five new keys — identical values,
copied verbatim so the create and edit forms render the same labels):
```yaml
allegiance_label: Allegiance
public_allegiance_label: Public Allegiance
allegiance_ally: Ally
allegiance_enemy: Enemy
allegiance_neutral: Neutral
```

`game_npcs_page` (existing namespace, new filter keys, mirroring
`filter_status_label`/`filter_status_alive`/`filter_status_slain`):
```yaml
filter_allegiance_label: Allegiance
filter_allegiance_ally: Ally
filter_allegiance_enemy: Enemy
filter_allegiance_neutral: Neutral
```

These exact key names are the source of truth both agents implement against.
If the `frontend` agent's implementation needs to diverge from this list,
it must update `translator.md`/`frontend.md` to keep them in lockstep.
