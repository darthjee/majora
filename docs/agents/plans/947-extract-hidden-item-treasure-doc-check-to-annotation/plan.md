# Plan: Extract hidden item/treasure/Doc check to annotation

Issue: [947-extract-hidden-item-treasure-doc-check-to-annotation.md](../issues/947-extract-hidden-item-treasure-doc-check-to-annotation.md)

## Overview

Apply the existing `@check_hidden` decorator (`backend/games/views/game/_decorators.py`, from issue #946) to 8 mutation endpoints that currently resolve the PC/NPC directly and skip the hidden-character gate entirely — the same class of bug issue #864 already fixed once for `items.json`'s `POST` branch, now recurring in 8 more places. Also extract `GameTreasure`'s hand-rolled duplicate of the same gate logic (`games/views/games/game_treasure_detail.py`) into a shared helper both `Character`- and `GameTreasure`-scoped call sites can use.

## Context

Issue #947 originally called out a single confirmed gap: `items/acquire.json` never checks whether the target NPC is hidden (only the `GameItem` being acquired). Planning-phase exploration of every `_get_character_or_404(...)`-resolving call site in `backend/games/views/game/_character_shared.py` found the **same gap in 8 places**, not just 1 — every plain (non-`/all.json`) mutation endpoint that resolves `character` directly instead of routing through `@check_hidden`:

1. `build_item_acquire_view` → `character_item_acquire` (`_item_exchange.py`) — the originally reported case
2. `build_item_remove_view` → `character_item_remove` (`_item_exchange.py`)
3. `build_document_acquire_view` → `character_document_acquire` (`_document_exchange.py`)
4. `build_document_remove_view` → `character_document_remove` (`_document_exchange.py`)
5. `build_treasure_buy_view` → `character_treasure_buy` (`_treasure_exchange.py`)
6. `build_treasure_sell_view` → `character_treasure_sell` (`_treasure_exchange.py`)
7. `build_treasure_acquire_view` → `character_treasure_acquire` (`_treasure_exchange.py`)
8. `build_treasure_remove_view` → `character_treasure_remove` (`_treasure_exchange.py`)

In every case, a hidden NPC's mutation-family endpoints currently succeed for any caller, exactly the class of issue #864 already fixed once for `POST items.json` (`build_items_view`, `_character_shared.py:172-177`, which explicitly re-adds an inline `_hidden_gate_response` pre-check with a comment explaining why — that pattern was never applied to these 8). The `/all.json` DM-only variants of all 8 are unaffected: they already call `check_game_edit`/`_check_character_all_permission` first, which implies visibility.

Two call sites were checked and found **already correct** (not part of this bug): `build_items_view`'s `POST` branch (inline fix from #864) and `build_item_detail_view`'s `PATCH` branch → `character_item_update` (`_item_update.py`), which already inlines its own `_hidden_gate_response` check.

Separately, `games/views/games/game_treasure_detail.py` reimplements the exact same permission-gated "404 if hidden and requester can't edit" logic as `games/views/game/_shared.py::_hidden_gate_response`, just keyed on `(game_treasure, game)` instead of `(character, character)`.

### Scope correction vs. the issue's original design discussion

The issue's dialogue phase proposed parameterizing `@check_hidden` per entity kind (e.g. `@check_hidden('item')`, `@check_hidden('treasure')`) so multi-entity endpoints could stack decorators. Concrete code inspection during planning shows this isn't the right shape:

- The `GameItem`/`GameDocument`/`GameTreasure` **catalog** hidden-checks used during acquire/buy/summary (`_find_game_item`, `_find_game_document`, `_find_game_treasure` in `_item_exchange.py`/`_document_exchange.py`/`_treasure_exchange.py`) are a structurally different, already-uniform, already-minimal pattern: a plain `allow_hidden` boolean the call site decides (based on a separate permission check like `check_game_edit`), not a `request.user`-derived permission gate. They are one-liners already and are **not** duplicated boilerplate worth extracting.
- The only genuinely duplicated *permission-gated* pattern (resolve entity → 404 if `entity.hidden and not owner.can_be_edited_by(request.user)`, with `X-Skip-Cache`) exists in exactly two shapes: `Character` (10+ existing uses via `@check_hidden`, now +8 more) and the single `GameTreasure` case in `game_treasure_detail.py`. There's no repeated need to *stack* multiple such decorators on one endpoint — `character_item_acquire`, for example, already gates the `GameItem` correctly via `_find_game_item`; it only needs the `Character` gate added, not a second stacked decorator.

This plan generalizes the shared *helper function* (so `GameTreasure` can reuse it) rather than turning `@check_hidden` itself into a multi-kind, stackable decorator — a smaller, more accurate change than what was discussed before implementation-level code was examined.

## Implementation Steps

### Step 1 — Generalize the hidden-gate helper for reuse outside `games/views/game/`

`game_treasure_detail.py` lives in `games/views/games/` (game-level detail views), a sibling package to `games/views/game/` (character-scoped views) — it can't import `games/views/game/_shared.py`'s private `_hidden_gate_response` directly, which is why it was reimplemented. Add a generic version to `backend/games/views/common.py` (already imported by both packages via `..common`):

```python
def hidden_gate_response(entity, owner, request):
    """Return a 404 Response (with X-Skip-Cache) if entity is hidden and owner isn't editable by request.user."""
```

Keep `games/views/game/_shared.py::_hidden_gate_response(character, request)` as a thin wrapper delegating to the new common one with `owner=character` — this avoids touching any of its existing callers (`_decorators.py`, `_items.py`, `_item_update.py`, `_item_summary.py`, `_treasure_summary.py`, `_document_summary.py`).

### Step 2 — Dedupe `GameTreasure`'s hand-rolled gate

In `games/views/games/game_treasure_detail.py`, delete the local `_hidden_gate_response` and call the new `games/views/common.py::hidden_gate_response(game_treasure, game, request)` instead.

### Step 3 — Apply `@check_hidden` to the 8 missing mutation endpoints

For each of the 8 functions listed in Context: decorate with `@check_hidden` (import from `._decorators`), change its signature to accept the resolved `character` and a `check_hidden` kwarg (matching the existing convention used by `character_items`/`character_documents`/etc.), and update its builder in `_character_shared.py` to stop calling `_get_character_or_404` itself — instead pass `character_id`, `npc=npc`, `check_hidden=npc` through to the now-decorated function, exactly mirroring how `build_items_view`'s `GET` branch already calls `character_items`.

Note: these are mutation (`POST`) endpoints, so unlike the GET-list functions, they have no existing need to set `X-Skip-Cache` on their *success* response (POSTs aren't cached by Tent) — only the pre-check matters. The decorator still forwards `check_hidden` as a required kwarg to the wrapped function regardless; confirm whether an intentionally-unused parameter needs a lint suppression under this project's `ruff` config (`poetry run ruff check .`), or whether it's cleaner to have these 8 functions accept but simply not branch on it (no header logic needed).

Preserve the existing `check_hidden=npc` convention (the gate only applies for NPCs, never PCs) — do not change that semantic for any of the 8.

### Step 4 — Regression tests

Add a "hidden NPC → 404" test case to each of the 8 corresponding NPC test files, mirroring the existing hidden-item precedent (`test_hidden_game_item_returns_404_via_public_endpoint` in `game_npc_item_acquire_test.py:92`):

- `games/tests/views/game/npcs/detail/items/game_npc_item_acquire_test.py`
- `games/tests/views/game/npcs/detail/items/game_npc_item_remove_test.py`
- `games/tests/views/game/npcs/detail/documents/game_npc_document_acquire_test.py`
- `games/tests/views/game/npcs/detail/documents/game_npc_document_remove_test.py`
- `games/tests/views/game/npcs/detail/treasures/game_npc_treasure_buy_test.py`
- `games/tests/views/game/npcs/detail/treasures/game_npc_treasure_sell_test.py`
- `games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py`
- `games/tests/views/game/npcs/detail/treasures/game_npc_treasure_remove_test.py`

Each new case: create the NPC with `hidden=True`, hit the plain (non-DM) endpoint as a non-editing caller, assert `404` — plus one case confirming the DM/owner (`can_be_edited_by`) still succeeds against a hidden NPC, matching the existing `_hidden_gate_response` semantics used elsewhere. Also add a regression test for `game_treasure_detail_test.py` confirming behavior is unchanged after the Step 2 dedupe (no new case needed there beyond re-running existing coverage, since it's a pure refactor).

Confirm the PC-side equivalents (`games/tests/views/game/pcs/detail/...`) are unaffected — `check_hidden=npc` means PCs never gate on hidden, so no new PC test cases are needed; existing PC tests should keep passing unchanged.

## Files to Change

- `backend/games/views/common.py` — add generic `hidden_gate_response(entity, owner, request)`.
- `backend/games/views/game/_shared.py` — `_hidden_gate_response` becomes a thin wrapper over the common helper.
- `backend/games/views/games/game_treasure_detail.py` — delete local `_hidden_gate_response`, use the common one.
- `backend/games/views/game/_item_exchange.py` — `character_item_acquire`, `character_item_remove` gain `@check_hidden`.
- `backend/games/views/game/_document_exchange.py` — `character_document_acquire`, `character_document_remove` gain `@check_hidden`.
- `backend/games/views/game/_treasure_exchange.py` — `character_treasure_buy`, `character_treasure_sell`, `character_treasure_acquire`, `character_treasure_remove` gain `@check_hidden`.
- `backend/games/views/game/_character_shared.py` — update `build_item_acquire_view`, `build_item_remove_view`, `build_document_acquire_view`, `build_document_remove_view`, `build_treasure_buy_view`, `build_treasure_sell_view`, `build_treasure_acquire_view`, `build_treasure_remove_view` to stop resolving `character` themselves and instead route through the decorated functions via `character_id`/`npc`/`check_hidden`.
- Test files listed in Step 4.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`, covers `game_treasure_detail_test.py`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- This plan diverges from the issue's originally-discussed "parameterize `@check_hidden` per entity kind, stack decorators for multi-entity endpoints" design — see "Scope correction" in Context above for why, based on what implementation-level code inspection actually found.
- The `cache` agent's read-only remit ("reviews... that restricted endpoints set the `X-Skip-Cache` header") is worth a post-implementation glance, given this touches several 404-gate responses that already set that header — no action needed here beyond flagging it, since `cache` doesn't own file changes for this plan.
- `security`/`data-access` are read-only reviewers over auth/visibility logic changes like this one — expect them to review the diff in the normal PR flow; no plan-time action needed.
