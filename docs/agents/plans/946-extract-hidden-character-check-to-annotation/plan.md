# Plan: Extract hidden character check to annotation

Issue: [946-extract-hidden-character-check-to-annotation.md](../issues/946-extract-hidden-character-check-to-annotation.md)

## Overview

Extract the repeated "resolve character, then gate on hidden" pattern out of 10 shared
view-implementation functions under `backend/games/views/game/` into a single `check_hidden`
decorator, in a new `backend/games/views/game/_decorators.py` module. Pure refactor — no
behavior change, no new/changed endpoints, no test-visible behavior change (all existing tests
exercise these through HTTP, never by calling the shared functions directly, so they double as
the regression safety net).

## Context

Every one of these functions repeats the same three-part sandwich:

```python
def character_items(request, game, character_id, npc, check_hidden, allow_hidden=False, ...):
    character = _get_character_or_404(game, character_id, npc)          # ① resolve
    if check_hidden:                                                     # ② gate
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response
    ...business logic using character...
    response = ...
    if check_hidden and character.hidden:                                # ③ cache header
        response['X-Skip-Cache'] = 'true'
    return response
```

`character_id`/`npc` are used only to produce `character` in step ①, never again afterward, so a
decorator can own resolve (①) and gate (②). Step ③ (the cache-header line) is a documented,
deliberate deviation (`docs/agents/access-control/character.md`'s "Hidden-detail cache
deviation") and stays exactly where and how it is today, per function — not touched by this
issue.

## Implementation Steps

### Step 1 — Add the `check_hidden` decorator

Create `backend/games/views/game/_decorators.py`:

```python
"""View-implementation-level decorators for games/views/game/ (issue #946).

Unlike backend/games/decorators.py (cache-tier decorators applied to the outer @api_view-wrapped
views), this module holds decorators that transform the shared character_xxx(...) implementation
functions' own arguments.
"""

from functools import wraps

from ._shared import _get_character_or_404, _hidden_gate_response


def check_hidden(view_func):
    """Decorate a character_xxx(request, game, character, ...) function.

    Resolves `character` from `(game, character_id, npc)` and, when `check_hidden` is True,
    404s (via `_hidden_gate_response`) if the character is hidden and the requester cannot edit
    it. `character_id`/`npc` are consumed here and never reach `view_func`, which instead
    receives the resolved `character`. `check_hidden` itself IS still forwarded (as a keyword)
    since callers keep their own check_hidden-guarded cache-header line unchanged.
    """

    @wraps(view_func)
    def wrapper(request, game, character_id, *args, npc, check_hidden, **kwargs):
        character = _get_character_or_404(game, character_id, npc)
        if check_hidden:
            error_response = _hidden_gate_response(character, request)
            if error_response:
                return error_response
        return view_func(request, game, character, *args, check_hidden=check_hidden, **kwargs)

    return wrapper
```

`npc`/`check_hidden` are keyword-only in `wrapper`'s signature (after the bare `*args`) —
verified every call site already passes them as keywords, never positionally, so this is a safe,
non-breaking signature.

### Step 2 — Convert the 10 affected functions

For each function below, drop the `character_id`/`npc` params in favor of a `character` param,
add `@check_hidden`, delete the now-decorator-owned resolve+gate lines (①②), and leave the
cache-header line (③, where present) untouched aside from now reading `character` from the
parameter instead of a local variable:

- `_documents.py` — `character_documents`, `character_document_detail`
- `_items.py` — `character_items`, `character_item_detail`
- `_treasures.py` — `character_treasures`
- `_photos.py` — `character_photos`
- `_detail.py` — `character_detail` (note: its cache-header line is unconditional —
  `if character.hidden:`, no `check_hidden and` guard — keep that exact difference, do not
  normalize it to match the others)
- `_document_content.py` — `character_document_content`
- `_document_exchange.py` — `character_documents_available`
- `_item_exchange.py` — `character_items_available`

For the three functions that take an extra positional id between `character_id` and `npc`
(`character_item_detail`'s `item_id`, `character_document_detail`'s `document_id`,
`character_document_content`'s `document_id`), keep that id in the same position — the
decorator's `*args` passthrough forwards it unchanged, so only the leading
`character_id, npc, check_hidden` triplet at the call site needs to become `character` (via the
decorator) in the definition; no other reordering needed.

`character_document_files`/`character_document_photos` (`_document_files.py`/
`_document_photos.py`) are thin pass-throughs to `character_document_content` — leave them as-is,
they don't call `_get_character_or_404`/`_hidden_gate_response` themselves and don't need
`@check_hidden`.

### Step 3 — Update call sites

Every call site already passes `character_id`/`document_id`/`item_id` positionally and
`npc=`/`check_hidden=`/`allow_hidden=`/`serializer_class=` as keywords (verified in
`_character_shared.py` and the per-endpoint view files under `games/npcs/`, `games/pcs/`) — no
call site needs to change its call shape, since the decorator preserves the exact same external
call signature the un-decorated function used to have. Grep for each of the 10 function names
across `backend/games/views/game/` (including `_character_shared.py`'s `build_*` factories and
any standalone per-endpoint view file, e.g. `game_npc_detail.py`) to confirm nothing calls them
positionally with `npc`/`check_hidden` — if one is found, convert it to keyword-form as part of
this step rather than special-casing the decorator.

### Step 4 — Run the test suite

Run the existing test suite for this area (see CI Checks below) with no test changes expected —
these functions are only ever exercised through the HTTP views in tests, never called directly,
so a passing suite here is the regression signal that the refactor is behavior-preserving. If any
test fails, that's a sign the refactor changed behavior somewhere (e.g. missed the `_detail.py`
unconditional-vs-guarded cache-header distinction) — fix the refactor, not the test.

## Files to Change

- `backend/games/views/game/_decorators.py` — new file, the `check_hidden` decorator.
- `backend/games/views/game/_documents.py` — `character_documents`, `character_document_detail`.
- `backend/games/views/game/_items.py` — `character_items`, `character_item_detail`.
- `backend/games/views/game/_treasures.py` — `character_treasures`.
- `backend/games/views/game/_photos.py` — `character_photos`.
- `backend/games/views/game/_detail.py` — `character_detail`.
- `backend/games/views/game/_document_content.py` — `character_document_content`.
- `backend/games/views/game/_document_exchange.py` — `character_documents_available`.
- `backend/games/views/game/_item_exchange.py` — `character_items_available`.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)

## Notes

- No new tests are expected — this is a behavior-preserving refactor and the existing HTTP-level
  test suite already covers every affected endpoint.
- Do not normalize `_detail.py::character_detail`'s unconditional cache-header check
  (`if character.hidden:`) to match the other functions' `if check_hidden and character.hidden:`
  guard — that difference is intentional (per `character.md`'s documented deviation) and out of
  scope for this issue.
- Only `backend` has work here — no frontend, cache-warmer, proxy, infra, or translation changes;
  the API surface (URLs, request/response shapes) is unchanged.
