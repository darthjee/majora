# Split uploads views_test.py into one test file per entity

## Context

`backend/uploads/tests/views_test.py` is a 1549-line monolith containing a single
`TestUploadFinalizeView` class whose `setUpTestData` builds fixtures for nine entities in one
shared block: `GamePhoto`, `CharacterPhoto` (both PC and NPC), `TreasurePhoto`, `GameItemPhoto`,
`GamePossessionPhoto`, `CharacterItemPhoto`, `GameDocumentPhoto`, `GameDocumentFile`, and
`GameDocumentFilePhoto`. This hurts readability: understanding the tests for any single entity
requires scanning a shared fixture block that also builds fixtures for eight unrelated entities,
and the file mixes generic PATCH-endpoint behavior (auth, token validation, upload-type
mismatches) with entity-specific assertions.

The codebase already has a convention for one-file-per-entity upload finalize tests:
`backend/uploads/tests/views_source_test.py` (`SourcePhoto`) and
`backend/uploads/tests/views_stl_model_test.py` follow this pattern — each is a small,
self-contained `TestCase` with its own `setUpTestData` building only the fixtures it needs, plus
private helpers (`_patch`, `_valid_patch`) scoped to that file.

This was identified as a follow-up while fixing missing `FactionPhoto`/`CollectionPhoto`
registrations in the upload finalize handler registry (`backend/uploads/views.py`). That fix
added new standalone test files for those two entities but deliberately left the existing
`views_test.py` monolith untouched, since splitting it is a separate, riskier refactor —
untangling shared `setUpTestData`/fixture state across roughly eight new files — unrelated to
that bug fix.

## What needs to be done

Backend (`backend/uploads/tests/`):

- Split `views_test.py` into one test file per entity, following the naming and structure
  convention of `views_source_test.py` / `views_stl_model_test.py` (e.g.
  `views_game_photo_test.py`, `views_character_photo_test.py`, `views_treasure_photo_test.py`,
  `views_game_item_photo_test.py`, `views_game_possession_photo_test.py`,
  `views_character_item_photo_test.py`, `views_game_document_photo_test.py`,
  `views_game_document_file_test.py`, `views_game_document_file_photo_test.py` — exact filenames
  to be confirmed against the existing convention).
- Each new file should have its own `setUpTestData` building only the fixtures needed for that
  entity's tests (users, tokens, game/character, and the specific photo/file fixture), instead of
  sharing one large fixture block across all entities.
- Preserve every existing test case and its assertions/docstrings; this is a pure refactor with
  no behavior change. In particular, retain coverage for permission variations already present
  per entity (e.g. player-of-game, staff, DM, non-owner, unauthenticated) and entity-specific
  edge cases (e.g. `CharacterPhoto` PC vs NPC, `GameDocumentFilePhoto` orphaned-file handling).
- Decide where the generic, entity-agnostic PATCH endpoint behavior currently in
  `TestUploadFinalizeView` belongs (e.g. nonexistent upload returns 403, wrong/expired upload
  token, different user, already-uploaded status, invalid status value, unauthenticated request,
  session-cookie auth, mismatched `upload_type` URL segment, unrecognized `upload_type` URL
  segment). Keep these in a single shared/base file (e.g. a slimmed-down `views_test.py`) rather
  than duplicating them across every new per-entity file.
- Remove `views_test.py`'s monolithic class once its contents have been fully redistributed, or
  reduce it to just the generic/base tests described above.
- Run the full `backend/uploads/tests/` suite (via `docker-compose run` per project convention)
  to confirm no coverage was lost and all tests pass after the split.

Docs:

- No changes expected to `docs/agents/` beyond this issue file, since this is a test-organization
  refactor with no API, model, or access-control changes. Confirm during implementation that
  nothing under `docs/agents/architecture.md` documents the old file layout in a way that needs
  updating.

## Acceptance criteria

- [ ] `backend/uploads/tests/views_test.py`'s `TestUploadFinalizeView` fixtures and tests for each
      of the nine entities (`GamePhoto`, `CharacterPhoto` PC/NPC, `TreasurePhoto`,
      `GameItemPhoto`, `GamePossessionPhoto`, `CharacterItemPhoto`, `GameDocumentPhoto`,
      `GameDocumentFile`, `GameDocumentFilePhoto`) are moved into their own test file, following
      the `views_source_test.py` / `views_stl_model_test.py` convention.
- [ ] Each new per-entity file builds only the fixtures it needs in its own `setUpTestData`, with
      no shared cross-entity fixture block.
- [ ] Generic, entity-agnostic PATCH endpoint behavior tests are kept in a single shared/base file
      rather than duplicated per entity.
- [ ] No test coverage is lost: every test case present before the split has an equivalent after
      the split, and the full `backend/uploads/tests/` suite passes.
- [ ] `views_test.py` no longer contains a single monolithic class covering all nine entities.
