# Make the hidden gate strict on plain GETs

Today `hidden_gate_response(entity, owner, request)` (`backend/games/views/common.py`) 404s a
hidden entity only when `owner` can't be edited by the requester. The character family reaches
it through `_hidden_gate_response` (`_character/_shared.py`), the `check_hidden` decorator
(`_character/_decorators.py`) and `_check_npc_hidden_gate` (`_character/recipes/_recipe_shared.py`).

Add a strict mode in which a hidden entity is a `404` (still with `X-Skip-Cache: true`) whatever
the requester's roles are. For example, add a `public` keyword to `hidden_gate_response` /
`_hidden_gate_response`, and a `public_view` keyword that `check_hidden` consumes and doesn't
forward. Apply strict mode only when the view is a plain one **and** `request.method == 'GET'`,
so the narrow PATCH and the acquire/remove POSTs that share these helpers keep the editor-aware
gate.

Turn strict mode on in every plain GET listed in plan.md's contract:

- `game_npc_detail` (`character_detail`)
- the plain GET builders in `_character/{photos,items,documents,factions,possessions,recipes,treasures}/_*_shared.py`
  (collection, detail, `available`, and document `files`/`photos`): every builder that passes
  `check_hidden=npc` **without** `allow_hidden=True` and is a GET
- the plain NPC summary views `game_npc_{item,treasure,document,faction}_summary.py`
- `game_treasure_detail` (`games/game_treasure_detail.py`), GET branch only

Leave the `*_all` / `*_full` views and every write view unchanged. When a hidden character or
treasure can no longer get a `200` on a plain GET, remove the code that set `X-Skip-Cache` on
that successful response (`character_detail`, `game_treasure_detail`). Keep the header on
successful PATCH responses.

## Files to Change
- `backend/games/views/common.py` — strict mode in `hidden_gate_response`
- `backend/games/views/game/_character/_shared.py` — forward strict mode
- `backend/games/views/game/_character/_decorators.py` — `check_hidden` consumes the new keyword
- `backend/games/views/game/_character/_detail.py` — drop the now-unreachable hidden-success cache header on plain GET
- `backend/games/views/game/_character/recipes/_recipe_shared.py` — strict mode for plain recipe GETs
- `backend/games/views/game/_character/{photos,items,documents,factions,possessions,treasures}/_*_shared.py` — pass strict mode from plain GET builders
- `backend/games/views/game/npcs/game_npc_detail.py`
- `backend/games/views/game/npcs/detail/{items,treasures,documents,factions}/detail/game_npc_*_summary.py`
- `backend/games/views/games/game_treasure_detail.py`
