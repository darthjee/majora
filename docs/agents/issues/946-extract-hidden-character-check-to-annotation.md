# Issue: Extract hidden character check to annotation

## Description

Several endpoints under `/games/<slug>/npcs/<id>/...json` expose resources nested under an NPC
(items, documents, treasures, photos, and the NPC's own detail). For the "regular" (non-`/all.json`,
non-`/full.json`) variant of each of these, if the target NPC is hidden and the requester cannot
edit it, the endpoint must return `404` instead of leaking the NPC's existence/data.

This hidden-character gate is implemented correctly today, but the same three-line pattern is
copy-pasted across every function that needs it. This issue extracts that pattern into a
decorator, matching the existing `@restricted`/`@skip_cache`/`@regular` decorator style already
used in `backend/games/decorators.py`.

## Problem

The hidden-character gate is not duplicated as a single line — it's a three-part sandwich
repeated verbatim across several shared view-implementation functions under
`backend/games/views/game/` (`_documents.py`, `_items.py`, `_treasures.py`, `_photos.py`,
`_detail.py`, `_document_content.py`, and the `_available` functions in
`_document_exchange.py`/`_item_exchange.py` — 10 functions in total):

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

In every one of these, `character_id`/`npc` are used only to produce `character` in step ①,
never again afterward — so a decorator can own that resolution plus the gate, instead of every
function re-implementing both.

## Solution

Add a `check_hidden` decorator, in a new `backend/games/views/game/_decorators.py` module (a
view-layer-local decorators module, parallel to `backend/games/decorators.py` — which covers a
different concern, cache-tier — and to `_shared.py`, which holds the plain helper functions this
decorator composes: `_get_character_or_404`/`_hidden_gate_response`). It wraps a
`character_xxx(request, game, character, ...)`-shaped function, handling only the resolve (①)
and gate (②) steps — **not** the cache-header line (③), which is a documented, deliberate
deviation (`docs/agents/access-control/character.md`'s "Hidden-detail cache deviation": a
regular endpoint is normally cacheable, but a hidden character's response — reachable only by an
editor/DM the gate let through — must never be cached, or Tent would replay that peek to a later
public caller). That line stays exactly where it is today, per function; the decorator just needs
to keep `character` and `check_hidden` available to it:

```python
def check_hidden(view_func):
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

`npc`/`check_hidden` are keyword-only in the wrapper — every call site already passes them as
keywords, never positionally, so this is safe. `*args` transparently carries through the extra
positional id (`item_id`/`document_id`) that `character_item_detail`/`character_document_detail`/
`character_document_content` take between `character_id` and `npc`.

Each of the 10 affected functions (`_documents.py`::`character_documents`/
`character_document_detail`, `_items.py`::`character_items`/`character_item_detail`,
`_treasures.py`::`character_treasures`, `_photos.py`::`character_photos`,
`_detail.py`::`character_detail`, `_document_content.py`::`character_document_content`,
`_document_exchange.py`::`character_documents_available`,
`_item_exchange.py`::`character_items_available`) converts from taking
`(character_id, npc, check_hidden, ...)` to being decorated and taking `character` directly,
keeping its own `check_hidden`-guarded cache-header line unchanged, e.g.:

```python
@check_hidden
def character_items(request, game, character, check_hidden, allow_hidden=False, ...):
    items = character.character_items...
    ...
    response = paginated_list_response(...)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
```

`character_document_files`/`character_document_photos` (`_document_files.py`/
`_document_photos.py`) are thin pass-throughs to `character_document_content` and don't need
decorating themselves — only the function that actually does the resolve+gate does.

No behavior change: cache-header handling, `allow_hidden` filtering, PC-vs-NPC scoping (the gate
stays NPC-only — PCs have no `hidden` concept, per `character-photo.md`), and every other check
stay exactly as they are today. This issue is scoped purely to extracting the resolve+gate
duplication into the decorator.

## Benefits

- Removes ~10 copies of the same resolve+gate logic, leaving a single source of truth for the
  hidden-NPC-gate behavior.
- New endpoints that need the same gate just add `@check_hidden` instead of re-deriving the
  three-line pattern (and risking getting it subtly wrong, e.g. forgetting the gate entirely).
- Matches the project's existing decorator convention (`@restricted`/`@skip_cache`/`@regular`),
  so it reads as familiar rather than introducing a new pattern.
