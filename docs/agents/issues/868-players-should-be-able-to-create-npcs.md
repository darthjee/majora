# Issue: Players should be able to create NPCs

## Problem
Today NPC creation (`POST /games/<slug>/npcs.json`) is gated by `GameEditPermission` (dm/admin/superuser only, no staff, no player), enforced inline in `game_npcs.py`. This was split off from the broader permission audit in #864: simply broadening the permission to include players and staff would let a player-created NPC set `hidden`, `private_description`, `private_allegiance`, and `private_slain` through the existing `CharacterCreateSerializer`, which accepts the full field set from any permitted caller today.

This mirrors the situation #865 (delivered via PR #867) already solved for PC updates — a single endpoint conflating full/restricted-field access needed splitting into two routes rather than a bare permission swap. The same "partial vs full" pattern already exists for NPC reads/updates (`docs/agents/access-control/character.md`'s "Narrow player-facing NPC PATCH": `PATCH /games/<slug>/npcs/<id>.json` is `NpcPlayerEdit`-gated with a curated field set, separate from the DM-only `PATCH .../npcs/<id>/full.json`), but no such split exists yet for **creation**.

## Expected Behavior
- `POST /games/<slug>/npcs.json` (the existing "regular" endpoint) becomes accessible to dm, admin, superuser, staff, and any player of the game — but only accepts a curated, player-safe field set exactly matching `NpcPlayerUpdateSerializer`'s field set: `name`, `role`, `public_description`, `public_allegiance`, `public_slain`, `links`. It must never accept `hidden`, `private_description`, or `private_allegiance`.
- `POST /games/<slug>/npcs/full.json` (a new "full" endpoint, named to match the existing `.../full.json` single-resource convention rather than `.../all.json` which is already the NPC list/index route) is accessible only to dm, admin, and superuser — and accepts the full field set via the existing `CharacterCreateSerializer`, unchanged from today's behavior.
- The frontend "New NPC" create button (`GameCharactersHelper.jsx`/`GameNpcs.jsx`), currently gated on game-level `can_edit` (dm/admin/superuser only, reusing the game-edit flag rather than a dedicated creation flag), opens to any player of the game and to staff, routing to the regular endpoint's reduced-field form. DM/admin/superuser continue to reach the full-field form against `npcs/full.json`.
- A hidden NPC created by a non-privileged caller is impossible by construction (the field isn't accepted by the regular endpoint's serializer), not merely defaulted to `false`.

## Solution
- Add a new `POST /games/<slug>/npcs/full.json` view/route, gated by `GameEditPermission` (today's exact current behavior on `npcs.json`), accepting the full field set via the existing `CharacterCreateSerializer`.
- Change `POST /games/<slug>/npcs.json`'s permission to a new class granting dm/admin/superuser/staff/any-player-of-game (mirroring `NpcPlayerEdit`'s role composition), and give it a new reduced-field serializer (`NpcPlayerCreateSerializer`, matching `NpcPlayerUpdateSerializer`'s exact field set: `name`, `role`, `public_description`, `public_allegiance`, `public_slain`, `links`) that has no `hidden`/`private_*` fields declared at all.
- Update the frontend NPC create button/access guard to open to any player and staff instead of reusing game-level `can_edit`, add a dedicated `can_create_npc` flag (mirroring `can_create_item`/`can_create_document`'s entity-specific naming) computed server-side.
- Update the NPC create form/submit logic so dm/admin/superuser see and submit the full field set against `npcs/full.json`, while any other player of the game or staff see and submit only the reduced field set against `npcs.json`.
- Update `docs/agents/access-control/character.md`'s "Create" section (and `principles.md` if the partial-vs-full table's Create row needs filling in) to document the new split, mirroring how the "Narrow player-facing NPC PATCH" section is documented today.

Split off from #864.
