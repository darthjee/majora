# Plan: Plain (AllowAny) routes must never serve hidden content to editors

Issue: [1616-plain-allowany-routes-must-never-serve-hidden-content-to-editors.md](../../issues/1616-plain-allowany-routes-must-never-serve-hidden-content-to-editors.md)

## Overview

Every plain (AllowAny) GET that runs the editor-aware hidden gate (`hidden_gate_response`) will
404 a hidden NPC or hidden `GameTreasure` for **everyone**. Editors keep seeing hidden content
through the restricted `full.json`/`all.json` siblings. Two siblings are missing and get added:
`npcs/<id>/photos/all.json` and `games/<slug>/treasures/<id>/full.json`. The frontend switches
to those routes wherever an editor needs hidden content. Plain **write** routes keep the
editor-aware gate (out of scope per the issue).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### Plain GET routes: strict hidden gate

On a hidden NPC, every plain NPC GET below returns `404` (with `X-Skip-Cache: true`) for every
caller, including superuser, dm and the NPC's editor. Today these return `200` to an editor.

- `GET /games/<slug>/npcs/<id>.json`
- `GET /games/<slug>/npcs/<id>/photos.json`
- `GET /games/<slug>/npcs/<id>/{items,documents,factions,possessions,recipes,treasures}.json`
- `GET /games/<slug>/npcs/<id>/{items,documents,factions,possessions,recipes}/<x_id>.json`
- `GET /games/<slug>/npcs/<id>/{items,documents,factions,possessions,recipes}/available.json`
- `GET /games/<slug>/npcs/<id>/documents/<document_id>/{files,photos}.json`
- `GET /games/<slug>/{items,treasures,documents,factions}/<x_id>/npcs/<id>/summary.json`

On a hidden `GameTreasure`, `GET /games/<slug>/treasures/<treasure_id>.json` returns `404`
(with `X-Skip-Cache: true`) for every caller.

`PATCH`/`POST` on these same paths is unchanged: an editor can still write to a hidden NPC or
hidden treasure.

### New restricted routes

| Route | Method | Permission | Response |
|-------|--------|-----------|----------|
| `/games/<slug>/npcs/<id>/photos/all.json` | GET | **CharacterEdit** (`character.can_be_edited_by`, the same set that sees a hidden NPC today); permission checked before the hidden state is revealed | Same paginated `{id, path}` shape as `photos.json` (`ready=True` only), served even when the NPC is hidden. Always `X-Skip-Cache: true` |
| `/games/<slug>/treasures/<treasure_id>/full.json` | GET | **GameEdit**; permission checked before the treasure is resolved, so 401/403 never reveals whether a hidden treasure exists | `TreasureDetailSerializer` payload (same as the plain detail) plus `hidden` (bool, from the `GameTreasure` row; `false` when no row exists). Served even when hidden. Always `X-Skip-Cache: true` |

The existing restricted siblings (`npcs/<id>/full.json`, `.../all.json`, `.../full.json`,
`.../summary/all.json`, `.../available/all.json`) are unchanged.

There is no PC `photos/all.json`: PCs have no `hidden`, and the route is NPC-only, like
`npcs/<id>/treasures/all.json`.
