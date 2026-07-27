# Plan: Players should be able to create NPCs

Issue: [868-players-should-be-able-to-create-npcs.md](../issues/868-players-should-be-able-to-create-npcs.md)

## Overview

Split NPC creation into two routes, mirroring the existing "Narrow player-facing NPC PATCH"
pattern (issue #861) rather than broadening `POST /games/<slug>/npcs.json`'s permission in place:
a new `POST /games/<slug>/npcs/full.json` keeps today's exact DM/admin/superuser-only, full-field
behavior; the existing `POST /games/<slug>/npcs.json` gets a new permission class
(dm/admin/superuser/staff/any-player-of-game) and a new reduced-field serializer with no
`hidden`/`private_*` fields declared at all. The frontend gets a `can_create_npc` flag replacing
the game-level `can_edit` gate on the "New NPC" button, and the create form/submit logic splits
the same way the existing NPC edit form already splits between `full.json` and the plain PATCH
endpoint.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **New route `POST /games/<slug>/npcs/full.json`** (view `game_npcs_full`, url name
  `game-npcs-full`) — DM/admin/superuser only (`GameEditPermission`, today's exact `npcs.json`
  behavior), accepting the full field set via the existing `CharacterCreateSerializer`
  (`name`, `role`, `public_description`, `private_description`, `hidden`, `money`,
  `private_allegiance`, `public_allegiance`, `links`). Returns the same `CharacterDetailSerializer`
  201 body `npcs.json` returns today.
- **`POST /games/<slug>/npcs.json`'s new permission**: a new `NpcPlayerCreatePermission` class
  (`backend/games/permissions.py`), mirroring `GameItemCreatePermission`'s shape exactly —
  `is_allowed(user, game)` returns `user.is_staff or game.has_player(user) or
  game.can_be_edited_by(user)`; `is_allowed_for_roles(is_superuser, is_dm, is_staff, is_player)`
  returns `is_staff or is_superuser or is_dm or is_player`. (Not `NpcPlayerEditPermission`'s
  shape — that one has no Staff bypass, since it delegates to `character.can_be_edited_by`/
  `game.can_be_edited_by`, neither of which considers `is_staff`.)
- **New reduced serializer `NpcPlayerCreateSerializer`** (`backend/games/serializers/characters/
  npcs/npc_player_create.py`), `Meta.fields = ['name', 'role', 'public_description',
  'public_allegiance', 'public_slain', 'links']` — exactly `NpcPlayerUpdateSerializer`'s field
  set (confirmed with the issue reporter: `public_slain` is included even though a brand-new NPC
  can't already be slain, for consistency with the update serializer's field set). `name` stays
  `required=True` (unlike `NpcPlayerUpdateSerializer`, this is a create, not a partial update);
  every other field `required=False`. No `hidden`/`private_description`/`private_allegiance`/
  `private_slain`/`money` field declared at all — impossible to set by construction, not merely
  defaulted.
- **New `can_create_npc` field on `GamePermissionsSerializer`** (`backend/games/serializers/
  games/game_permissions.py`), mirroring `_get_can_create_item`/`_get_can_create_document`'s
  shape exactly, backed by `NpcPlayerCreatePermission.is_allowed`/`is_allowed_for_roles`. This is
  the field the frontend's "New NPC" button and `npcConfig.js`'s `POST.collection.regular`
  permission key both key off; the existing `can_edit` flag continues to gate the full-form path
  (`npcs/full.json`), unchanged.
- **`npcConfig.js`'s `POST.collection` split**: today `regular`/`private` point at the exact same
  object (`{ path: .../npcs.json, permission: 'can_edit' }`, no restricted/full variant). This
  becomes `regular: { path: .../npcs.json, permission: 'can_create_npc' }`, `private: { path:
  .../npcs/full.json, permission: 'can_edit' }` — same `regular`/`private` shape `GET.single`/
  `PATCH.single` already use for this same resource.

## Notes

- No new frontend `AccessStore`/`RequestPermissionResolvers` wiring is needed beyond the
  `npcConfig.js` change above — `npc.collection`'s resolver already calls
  `AccessStore.ensureGamePermissions(gameSlug)`, which will already carry `can_create_npc` once
  the backend serializer change lands.
- `docs/agents/access-control/character.md`'s "Create" section and `principles.md`'s
  partial-vs-full table both need updating to document the new split — assigned to backend.md
  since they're access-control docs tied directly to the permission/serializer classes, mirroring
  how #864's plan folded its own doc updates into its `backend.md`.
