# Plan: Security: NPC/PC 'full' and 'all' endpoints cache permission-gated data without X-Skip-Cache

Issue: [330-security--npc-pc--full--and--all--endpoints-cache-permission-gated-data-without-x-skip-cache.md](../issues/330-security--npc-pc--full--and--all--endpoints-cache-permission-gated-data-without-x-skip-cache.md)

## Overview

`GET /games/:slug/npcs/all.json`, `GET /games/:slug/npcs/:id/full.json`, and
`GET /games/:slug/pcs/:id/full.json` are gated by DM/owner-only permission checks but
never set the `X-Skip-Cache` response header, so the shared Tent proxy cache can serve a
permission-gated response (private descriptions, hidden NPCs) to a lower-privileged
requester hitting the same URL. `GET /games/:slug/npcs/:id.json` has the same problem for
hidden NPCs: its 404-vs-200 branching depends on the requester's identity, so a DM's 200
response could be cached and served to an anonymous visitor, defeating the hidden-NPC
gate entirely. The fix sets `X-Skip-Cache` on the affected backend responses and adds the
matching request-side header on the frontend so Tent neither reads from nor writes to the
shared cache for these calls, per `docs/agents/security-guidelines.md` section 6.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

No payload/schema changes. The only cross-cutting contract is the `X-Skip-Cache` header
convention already used elsewhere in the app (see `source/games/views/common.py`'s
`access_response()` and `frontend/assets/js/client/BaseClient.js`):

- Backend sets the **response** header `X-Skip-Cache: true` on:
  - `GET /games/:slug/npcs/all.json`
  - `GET /games/:slug/npcs/:id/full.json`
  - `GET /games/:slug/pcs/:id/full.json`
  - `GET /games/:slug/npcs/:id.json` (plain NPC detail — hidden-NPC gate)
- Frontend sends the **request** header `X-Skip-Cache: true` on the matching client calls:
  - `CharacterClient#fetchNpcsAll` (`/games/:slug/npcs/all.json`)
  - `CharacterClient#fetchNpcFull` / `#fetchPcFull` (`.../full.json`)
  - `CharacterClient#fetchNpc` (`/games/:slug/npcs/:id.json`, plain detail only — **not**
    `#fetchPc`, which has no hidden-gate and is unaffected)

## Notes (out of scope, flagged for follow-up)

- `GET /games/:slug/pcs/:id.json` (`game_pc_detail`) has no hidden-gate — the `hidden`
  field is only ever set on NPCs (`CharacterCreateSerializer` is NPC-only), so its
  response content does not vary by requester identity in a security-relevant way. Left
  unchanged.
- `CharacterDetailSerializer.can_edit` (used by both `game_npc_detail` and
  `game_pc_detail`, and shared more broadly via `detail_or_update`/`game_detail`/
  `game_session_detail`) is technically requester-dependent, but only reveals whether the
  current viewer may edit — not the gated content itself. Fixing this for every
  `detail_or_update` consumer is a broader change outside this issue's stated scope;
  recommend a follow-up issue if this is judged worth closing.
