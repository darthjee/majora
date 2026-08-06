# Backend Plan: Introduce Add document modal

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the four new summary endpoints and the new `regular.create` permission tier described in
[plan.md](plan.md)'s "Shared contracts" section. Consumes nothing from the other agents.

## Implementation Steps

### Step 1 — Shared document-summary logic

Create `backend/games/views/game/_document_summary.py`, mirroring
`backend/games/views/game/_treasure_summary.py`:

```python
"""Shared implementation for the per-character/per-document ownership summary endpoints."""

from rest_framework.response import Response

from ...permissions import EndpointPermission
from ._document_exchange import _find_game_document
from ._shared import _get_character_or_404, _hidden_gate_response


def character_document_summary(
    request, game, character_id, document_id, npc, check_hidden, allow_hidden=False,
):
    """Return {'owned': <bool>} — whether `character` already owns `document_id`.

    Boolean instead of `character_treasure_summary`'s `quantity`, since `CharacterDocument` is a
    plain join (`unique_together = ('character', 'game_document')`, no quantity field). Reuses
    `_find_game_document` (from `_document_exchange.py`) for the hidden-`GameDocument` gate,
    exactly like `character_treasure_summary` reuses `_find_game_treasure`. `allow_hidden`
    bypasses that gate — reserved for the `/summary/all.json` endpoints.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    document = _find_game_document(game, document_id, allow_hidden)
    owned = character.character_documents.filter(game_document=document).exists()

    return Response({'owned': owned})


def check_document_summary_all_permission(request, game, resource, character=None):
    """Return an error Response if `request.user` may not view the full document summary.

    Mirrors `check_treasure_summary_all_permission` exactly — reuses the existing
    `game_pc_document`/`game_npc_document` `restricted.create` tier unchanged (see Step 5's Notes
    for why no new permission config is needed here).
    """
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, resource, 'restricted', 'create',
    )
```

### Step 2 — View files

Add four view files, mirroring the treasure summary view quartet exactly (same decorators,
same `AllowAny`/`check_hidden`/`allow_hidden` wiring):

- `backend/games/views/game/pcs/detail/documents/game_pc_document_summary.py` — `@regular`
  `@skip_cache`, `AllowAny`, calls `character_document_summary(..., npc=False, check_hidden=False,
  allow_hidden=False)`.
- `backend/games/views/game/pcs/detail/documents/game_pc_document_summary_all.py` — `@restricted`,
  resolves the PC via `_get_character_or_404`, calls `check_document_summary_all_permission(request,
  game, 'game_pc_document', character)`, then `character_document_summary(..., npc=False,
  check_hidden=False, allow_hidden=True)`.
- `backend/games/views/game/npcs/detail/documents/game_npc_document_summary.py` — `@regular`
  `@skip_cache`, calls `character_document_summary(..., npc=True, check_hidden=True,
  allow_hidden=False)`.
- `backend/games/views/game/npcs/detail/documents/game_npc_document_summary_all.py` — `@restricted`,
  calls `check_document_summary_all_permission(request, game, 'game_npc_document')` (no character —
  permission checked *before* resolving the NPC, matching `game_npc_treasure_summary_all`'s own
  hidden-existence-leak prevention), then `character_document_summary(..., npc=True,
  check_hidden=True, allow_hidden=True)`.

### Step 3 — Wire up exports

Add the four new view functions to:
- `backend/games/views/game/pcs/__init__.py` (mirror the two `treasures.game_pc_treasure_summary*`
  import/`__all__` lines)
- `backend/games/views/game/npcs/__init__.py` (same, npc side)
- `backend/games/views/game/__init__.py`
- `backend/games/views/__init__.py`

### Step 4 — URL routes

Add four `path()` entries to `backend/games/urls/games.py`, right after the existing document
routes block, mirroring the treasure summary block's shape exactly:

```python
path(
    'games/<slug:game_slug>/documents/<int:document_id>/pcs/<int:character_id>/summary.json',
    views.game_pc_document_summary,
    name='game-document-pc-summary',
),
path(
    (
        'games/<slug:game_slug>/documents/<int:document_id>/pcs/<int:character_id>/'
        'summary/all.json'
    ),
    views.game_pc_document_summary_all,
    name='game-document-pc-summary-all',
),
path(
    'games/<slug:game_slug>/documents/<int:document_id>/npcs/<int:character_id>/summary.json',
    views.game_npc_document_summary,
    name='game-document-npc-summary',
),
path(
    (
        'games/<slug:game_slug>/documents/<int:document_id>/npcs/<int:character_id>/'
        'summary/all.json'
    ),
    views.game_npc_document_summary_all,
    name='game-document-npc-summary-all',
),
```

### Step 5 — Permission config: add a `regular` tier

Add a `regular.create` tier to both document permission configs — this is the one genuinely new
permission rule this issue needs:

`backend/games/permissions/config/game_pc_document/endpoints.yml`:
```yaml
restricted:
  create:
    - staff
    - owner
regular:
  create:
    - staff
    - player
```

`backend/games/permissions/config/game_npc_document/endpoints.yml`:
```yaml
restricted:
  create:
    - staff
regular:
  create:
    - staff
    - player
```

`dm`/`admin` are never listed explicitly — both always bypass via `BasePermission`'s shortcut
(`_shortcut_allows`: `is_admin() or is_dm()`).

**Deviation from the issue text**: the issue (written before this deeper pass) proposed also
narrowing `restricted.create` to `[owner]` (PC) / `[]` (NPC). Tracing the actual call sites (Step
6) shows this narrowing has **no observable effect** and is skipped — see Notes.

### Step 6 — Thread the tier through `_check_document_create`

In `backend/games/views/game/_document_exchange.py`, parameterize the tier instead of hardcoding
`'restricted'`:

```python
def _check_document_create(request, game, character, tier):
    """Return an error Response if `request.user` may not create/remove a document at `tier`."""
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_document_resource(character), tier, 'create',
    )
```

`character_document_acquire`/`character_document_remove` already take `allow_hidden` — compute
`tier = 'restricted' if allow_hidden else 'regular'` and pass it through. This is the actual fix
for the confirmed gap: today both the plain and `/all.json` endpoints check the same
`restricted.create` tier, so a non-owning, non-staff player can't acquire/remove a document at
all, even through the "regular" endpoint.

## Files to Change

- `backend/games/views/game/_document_summary.py` — new, Step 1
- `backend/games/views/game/pcs/detail/documents/game_pc_document_summary.py` — new, Step 2
- `backend/games/views/game/pcs/detail/documents/game_pc_document_summary_all.py` — new, Step 2
- `backend/games/views/game/npcs/detail/documents/game_npc_document_summary.py` — new, Step 2
- `backend/games/views/game/npcs/detail/documents/game_npc_document_summary_all.py` — new, Step 2
- `backend/games/views/game/pcs/__init__.py` — export new views, Step 3
- `backend/games/views/game/npcs/__init__.py` — export new views, Step 3
- `backend/games/views/game/__init__.py` — export new views, Step 3
- `backend/games/views/__init__.py` — export new views, Step 3
- `backend/games/urls/games.py` — new routes, Step 4
- `backend/games/permissions/config/game_pc_document/endpoints.yml` — add `regular.create`, Step 5
- `backend/games/permissions/config/game_npc_document/endpoints.yml` — add `regular.create`, Step 5
- `backend/games/views/game/_document_exchange.py` — tier param, Step 6
- `docs/agents/access-control/character-document.md` — add a "Document ownership summary
  endpoints (issue #1005)" section mirroring `character-treasure.md`'s "Treasure quantity summary
  endpoints" section (adjusted for `{"owned": bool}`); update the "Document acquire/remove
  endpoints" table's permission column to mention the new `regular.create` tier for the plain
  `/acquire.json`/`/remove.json` rows
- New tests (Step 8): `backend/games/tests/views/game/pcs/detail/documents/
  game_pc_document_summary_test.py`, `..._summary_all_test.py`, and the two npc equivalents under
  `backend/games/tests/views/game/npcs/detail/documents/` — mirror the treasure summary tests'
  cases (owned/not-owned, hidden-gate 404s, permission denial on `/all.json`)
- Updated tests: `backend/games/tests/views/game/{pcs,npcs}/detail/documents/
  game_{pc,npc}_document_{acquire,remove}_test.py` — add a case proving a plain player (not
  staff/owner) can now acquire/remove through the regular endpoint; add/keep a case proving a
  non-staff, non-owner, non-player-of-the-game user is still rejected

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job:
  `pytest_views_characters`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- **Why `restricted.create` is left unchanged (deviation from the issue text)**: tracing
  `build_document_acquire_all_view`/`build_document_remove_all_view` in `_character_shared.py`
  shows the `/all.json` endpoints are *already* gated at the view level, independently of
  `_check_document_create`'s tier — `remove_all` by `_check_character_all_permission` (PC:
  dm/admin/owner via `game_pc`/`restricted`/`edit`; NPC: dm/admin via `game`/`restricted`/`edit`),
  and `acquire_all` by the flatter `check_game_edit` (`game`/`restricted`/`edit` — dm/admin only,
  **no owner**, on both PC and NPC). Since a request that fails the outer gate never reaches the
  inner `_check_document_create` check, and dm/admin always pass the inner check via the shortcut
  regardless of its configured role list, narrowing `restricted.create`'s role list has **no
  observable effect** on either endpoint's actual behavior — it's already fully governed by the
  outer gate. Changing it anyway would be pure churn with a (small) risk of being wrong about some
  other, indirect caller.
- **`acquire/all.json`'s dm/admin-only, no-owner gate is intentional — do not widen it to include
  the PC's owning player.** `docs/agents/access-control/character-document.md`'s own "Document
  acquire/remove endpoints" section already documents this as deliberate: *"catalog visibility
  (`available/all`, `acquire/all`) is game-level, dm/admin only, no owner; owned-document
  visibility (`remove/all`) is character-level"* — and it's not document-specific:
  `build_item_acquire_all_view` (`_character_shared.py`) uses the exact same `check_game_edit`
  gate for `CharacterItem`. Adding PC-owner leniency to document's `acquire/all.json` (which one
  reading of the issue's confirmed permission dialogue could imply) would make `CharacterDocument`
  diverge from `CharacterItem`'s identical, intentional pattern. Recommend a `data-access`/
  `security` agent review of this plan before implementation if owner-access to hidden-document
  granting is genuinely wanted — it's a deliberate architectural line, not an oversight.
- **Latent, pre-existing gap in Item and Treasure's own acquire/remove permission tiers.** Item's
  `restricted.create` (`game_pc_item`/`game_npc_item`) and Treasure's
  `restricted.treasure_exchange` (`game_pc`) are *also* `[staff, owner]` (PC) / `[staff]` (NPC)
  only — the identical shape as Document's pre-fix gap. Since this issue's entry-point section
  widens the "Give Item"/"Give Treasure" buttons' *visibility* to any player/dm/staff/superuser
  without touching Item/Treasure's server-side permission tier, a plain non-owning player will now
  **see** those two buttons but get a `403` on submit. The existing per-row failure handling in
  `GiveItemModalController`/`GiveTreasureModalController` degrades gracefully (a per-character
  "unable to give" result, not a crash), so this isn't severe, but it's a real, visible
  inconsistency the issue text didn't ask to fix. Flagging for a follow-up issue rather than
  silently expanding this issue's scope to touch Item/Treasure's permission config.
