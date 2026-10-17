# Issue: Plain (AllowAny) routes must never serve hidden content to editors

## Description
The [default hidden-gated collection pattern](docs/agents/access-control/principles.md#default-hidden-gated-collection-pattern)
says plain `list.json`/`detail.json` endpoints are **AllowAny** and exclude hidden rows, while hidden
content is served only by the restricted `all.json`/`full.json` siblings.

Several plain endpoints deviate: they serve hidden content to a privileged caller (dm, superuser,
the character's editor) and 404 only for everyone else. All known cases go through one helper,
`hidden_gate_response` (`backend/games/views/common.py`), used directly or via
`_hidden_gate_response` / the `check_hidden` decorator (`backend/games/views/game/_character/`):

- **NPC detail** — `GET games/<slug>/npcs/<id>.json` serves a hidden NPC to an editor (hence the
  "Hidden-detail cache deviation" in `docs/agents/access-control/character.md`).
- **Hidden-NPC gate** (`docs/agents/access-control/character-photo.md#hidden-npc-gate`) on the plain
  NPC nested reads: `photos.json`, `items.json`, `items/<item_id>.json`, `documents.json`,
  `treasures.json`, factions, possessions, recipes, and the plain `.../npcs/<id>/summary.json`
  endpoints (item, treasure, document, faction).
- **Game treasure detail** — `GET games/<slug>/treasures/<id>.json` serves a hidden `GameTreasure`
  to a game editor (`backend/games/views/games/game_treasure_detail.py`). Not listed originally.

Plain routes therefore act as role-aware endpoints instead of returning only what an anonymous
caller would see.

## Problem
Epic #1592 (scoped API tokens): `docs/agents/specs/client/scopes.md` (#1595) settles that **public
(plain) reads need no scope**, while restricted `all`/`full` reads need the scopes of every family
involved. That rule only holds if a plain route never returns more to a privileged caller than to an
anonymous one. This issue is therefore a prerequisite of #1603 (scope enforcement).

## Expected Behavior
- No plain (AllowAny) **GET** endpoint returns different data depending on the caller's role: a
  hidden entity is a 404 for everyone, hidden rows are excluded for everyone.
- Editors still see hidden content through the restricted `full.json`/`all.json` routes, and the
  frontend still works for them.
- The access-control docs no longer list these deviations.

## Solution
- Survey every plain (AllowAny) GET endpoint for role-dependent responses: hidden rows,
  hidden-entity gates, `incognito`, `private_*` fields, or anything else served only to editors.
  Start from the `hidden_gate_response` callers, but cover every resource.
- For each case, make the plain route return the anonymous view and make sure the restricted
  `full.json`/`all.json` sibling serves the editor's view. Add a restricted sibling where one is
  missing (e.g. NPC `photos.json` has no `all.json`).
- Update the frontend to call the restricted sibling wherever it relied on the plain route serving
  hidden content to an editor.
- Remove the now-obsolete deviations from the access-control docs, including the "Hidden-detail
  cache deviation" `X-Skip-Cache` exception on character and game-treasure detail.
- Check the cache warmer (`navi/`) and the proxy for any assumption about these routes.
- Ship all of this as one change: the backend and frontend parts have to land together, or
  editors lose access to hidden content.

### Out of scope

- **Plain write routes** (narrow NPC `PATCH npcs/<id>.json`, `items/acquire.json`,
  `items/remove.json`, item `PATCH`) keep the hidden-NPC gate as it is: editors can still write to
  a hidden NPC through them. Writes are authenticated and scoped anyway, so they don't affect the
  "plain reads need no scope" rule.

## Benefits
- Makes the "plain reads need no scope" rule of #1595 sound, unblocking #1603.
- Plain routes become fully cacheable and identical for every viewer.
