# Issue: Split uploads views_test.py into one test file per entity

## Description

`backend/uploads/tests/views_test.py` is a 1549-line monolith containing a single
`TestUploadFinalizeView` class whose `setUpTestData` builds fixtures for nine entities in one
shared block: `GamePhoto`, `CharacterPhoto` (both PC and NPC), `TreasurePhoto`, `GameItemPhoto`,
`GamePossessionPhoto`, `CharacterItemPhoto`, `GameDocumentPhoto`, `GameDocumentFile`, and
`GameDocumentFilePhoto`. Understanding the tests for any single entity requires scanning a
shared fixture block that also builds fixtures for eight unrelated entities, and the file mixes
generic PATCH-endpoint behavior (auth, token validation, upload-type mismatches) with
entity-specific assertions.

The codebase already has a convention for one-file-per-entity upload finalize tests:
`backend/uploads/tests/views_source_test.py` (`SourcePhoto`) and
`backend/uploads/tests/views_stl_model_test.py` (`StlModelPhoto`) — each a small,
self-contained `TestCase` with its own `setUpTestData` building only the fixtures it needs, plus
private helpers scoped to that file.

This was identified as a follow-up while fixing issue #1088 (missing `FactionPhoto`/
`CollectionPhoto` registrations in the upload finalize handler registry,
`backend/uploads/views.py`). That fix added standalone `views_faction_test.py` and
`views_collection_test.py` files following the existing convention, and also added a
`TestPhotoHandlersRegistry` guard test that walks every `BasePhoto` subclass — but deliberately
left the pre-existing `views_test.py` monolith untouched, since splitting it is a separate,
riskier refactor unrelated to that bug fix. Issue #1088 is assumed already implemented for the
purposes of this issue.

## Problem

- Reading or modifying the tests for one entity (e.g. `GameItemPhoto`) requires understanding a
  ~1549-line file whose single `setUpTestData` also builds fixtures for eight other, unrelated
  entities — there is no way to isolate just the relevant fixtures and tests.
- The file conflates two different concerns: generic PATCH-endpoint mechanics that apply to
  every upload type (authentication, token validation, expiry, upload-type mismatch, invalid
  status transitions) and entity-specific behavior (permission rules and `mark_ready` semantics
  particular to each photo model). This makes it unclear, when reading a given test, whether it
  is asserting something generic or something specific to one entity.
- The codebase already settled on a better pattern for this (`views_source_test.py`,
  `views_stl_model_test.py`, and — assuming #1088 is done — `views_faction_test.py`,
  `views_collection_test.py`), so `views_test.py` is now the inconsistent outlier rather than the
  norm.

## Expected Behavior

- Each of the nine entities currently covered by `TestUploadFinalizeView` has its own test file
  under `backend/uploads/tests/`, named and structured like `views_source_test.py`/
  `views_stl_model_test.py`, each with a `setUpTestData` that builds only the fixtures that
  entity's tests need:
  - `views_game_test.py` (`GamePhoto` — the `_DEFAULT_HANDLERS` fallback case; still gets its
    own file for consistency, even though it isn't an explicit `_PHOTO_HANDLERS` entry)
  - `views_character_test.py` (`CharacterPhoto`, both PC and NPC)
  - `views_treasure_test.py` (`TreasurePhoto`)
  - `views_game_item_test.py` (`GameItemPhoto`)
  - `views_game_possession_test.py` (`GamePossessionPhoto`)
  - `views_character_item_test.py` (`CharacterItemPhoto`)
  - `views_game_document_test.py` (`GameDocumentPhoto`)
  - `views_game_document_file_test.py` (`GameDocumentFile`)
  - `views_game_document_file_photo_test.py` (`GameDocumentFilePhoto` — kept as a separate file
    from `GameDocumentFile` despite the tight coupling between the two models, following the
    strict one-file-per-model split; the orphaned-file-photo edge case, which spans both models,
    lives here since it's fundamentally about the photo's state)
- Generic, entity-agnostic PATCH-endpoint behavior (authentication, token validation/expiry,
  wrong user, already-uploaded status, invalid status value, session-cookie auth, mismatched or
  unrecognized `upload_type` URL segment) — plus the registry-level `TestPhotoHandlersRegistry`
  guard test added by issue #1088 — lives in a single renamed `views_finalize_test.py`
  (previously `views_test.py`), not duplicated across the new per-entity files.
- Every test case and assertion that exists today still exists after the split — this is a pure
  reorganization with no behavior change and no coverage loss.
- The full `backend/uploads/tests/` suite passes after the split.

## Solution

Split `backend/uploads/tests/views_test.py` into ten files under `backend/uploads/tests/`,
following the naming and structure convention of `views_source_test.py`/
`views_stl_model_test.py` (`views_<entity>_test.py`, dropping the `Photo` suffix from the model
name — e.g. `SourcePhoto` → `views_source_test.py`), each with its own `setUpTestData` building
only that entity's fixtures, and its own private helpers (`_patch`, `_valid_patch`, etc.):

- `views_game_test.py` — `GamePhoto`
- `views_character_test.py` — `CharacterPhoto` (PC and NPC)
- `views_treasure_test.py` — `TreasurePhoto`
- `views_game_item_test.py` — `GameItemPhoto`
- `views_game_possession_test.py` — `GamePossessionPhoto`
- `views_character_item_test.py` — `CharacterItemPhoto`
- `views_game_document_test.py` — `GameDocumentPhoto`
- `views_game_document_file_test.py` — `GameDocumentFile`
- `views_game_document_file_photo_test.py` — `GameDocumentFilePhoto`
- `views_finalize_test.py` (renamed from `views_test.py`) — generic, entity-agnostic
  PATCH-endpoint behavior (nonexistent upload, wrong/expired token, wrong user,
  already-uploaded status, invalid status value, unauthenticated request, session-cookie auth,
  mismatched/unrecognized `upload_type`), plus the registry-level `TestPhotoHandlersRegistry`
  guard test added by issue #1088 (not entity-specific, so it belongs here rather than in any
  per-entity file)

Preserve every existing test case, assertion, and docstring — pure refactor, no behavior change.
In particular retain per-entity permission-variation coverage already present (player-of-game,
staff, DM, non-owner, unauthenticated) and entity-specific edge cases (`CharacterPhoto` PC vs
NPC, the `GameDocumentFilePhoto` orphaned-file-photo case spanning both document-file models).

Delete the old `views_test.py` once its contents are fully redistributed into
`views_finalize_test.py` and the nine per-entity files above.

Run the full `backend/uploads/tests/` suite (via `docker-compose run` per project convention) to
confirm no coverage was lost and all tests pass after the split.

## Benefits

- Tests for a given entity can be read and modified in isolation, without scanning fixtures for
  eight unrelated entities.
- Generic PATCH-endpoint mechanics and entity-specific behavior are no longer conflated in one
  file.
- `backend/uploads/tests/` becomes fully consistent with the one-file-per-entity convention
  already used elsewhere in the same directory.
