# Plan: Normalize photo path segments and file names

Issue: [813-normalize-photos-name.md](../../issues/813-normalize-photos-name.md)

## Overview

Introduce a single `PhotoPathBuilder` used by all five photo/upload-init endpoints to build storage paths, with a shared normalization step that sanitizes the game slug and the filename stem (transliterating accents, replacing whitespace with `_`, stripping other invalid characters). Also replace the `isinstance` dispatch chains in `upload_finalize.py` with a single per-entity-type registry, since it shows the same duplicated-per-entity pattern the issue calls out.

## Context

Five view files each implement their own private `_build_file_path()`:

- `games/views/photo_upload.py` (Game gallery photo)
- `games/views/game/_photo_upload.py` (Character PC/NPC photo)
- `games/views/game/_item_photo_upload.py` (Character item photo)
- `games/views/games/game_item_photo_upload.py` (Game item photo)
- `games/views/treasures/treasure_photo_upload.py` (Treasure photo)

None of them sanitize `game_slug`, and only two of them (Game and Character photo) incorporate the filename stem into the path at all — the other three use a fixed `photo{ext}` name. `games/serializers/photo_upload.py`'s `PhotoUploadSerializer.validate_filename` only strips directory components and checks the extension whitelist; it never touches the stem's characters.

`games/views/upload_finalize.py` has the same duplicated-per-entity-type shape on the finalize side, via two separate `isinstance` chains (`_check_permission`, `_mark_content_object_ready`).

Clarified during discussion:
- Normalization must transliterate accented/unicode letters to ASCII (e.g. `é` → `e`) and strip other non-ASCII symbols (emoji, etc.), not just the ASCII character list from the issue body.
- The game slug always goes through the same normalization logic as the filename stem, even though it is expected to already be a valid Django slug.
- Only the filename **stem** is normalized — the `.` separating stem from extension must never be touched, and the extension itself keeps going through the existing whitelist check unchanged.
- The centralized builder takes whether to append a UUID to the stem as a parameter (`use_uuid=True/False`), instead of each endpoint re-implementing its own `uuid.uuid4()` call. Endpoints that use a fixed name (e.g. `photo{ext}`) still pass that fixed name through the same normalization step, for consistency — it is a no-op on a string like `photo`, and endpoints using `use_uuid=True` can never end up with an empty result because the UUID suffix is always present.

## Implementation Steps

### Step 1 — Add the normalization + path-building module

Create `backend/games/photo_path.py` with:

- A pure `normalize_path_segment(value: str) -> str` function:
  - Transliterate accented/unicode letters to their closest ASCII equivalent (e.g. via `unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()`), dropping other non-ASCII symbols (emoji, etc.) in the process.
  - Replace whitespace (spaces, tabs, line breaks) with `_`.
  - Strip other invalid characters, at minimum: `&`, `/`, `\`, `:`, `,`, `[`, `]`, `(`, `)`, `{`, `}`.
- A `PhotoPathBuilder` class:
  - Constructor takes the path segments before the final file component (e.g. `'games', game_slug, 'characters', character_id`), the filename to use for the final component (already extension-validated by `PhotoUploadSerializer`), and a `use_uuid` flag.
  - `build()` splits the filename into stem/extension (`os.path.splitext`), runs `normalize_path_segment` on the stem and on every string segment (ids can pass through unchanged since they're already digits), appends a `uuid.uuid4()` to the stem when `use_uuid=True`, and joins everything under the existing `photos/` prefix, re-attaching the untouched extension at the end.

### Step 2 — Migrate the five endpoints to `PhotoPathBuilder`

Replace each private `_build_file_path()` with a call into `PhotoPathBuilder`, preserving today's exact path *shape* (only the sanitization behavior changes) and each endpoint's existing `use_uuid` behavior:

- `games/views/photo_upload.py` — `use_uuid=True`
- `games/views/game/_photo_upload.py` — `use_uuid=True`
- `games/views/game/_item_photo_upload.py` — `use_uuid=False`, fixed `photo{ext}` name
- `games/views/games/game_item_photo_upload.py` — `use_uuid=False`, fixed `photo{ext}` name
- `games/views/treasures/treasure_photo_upload.py` — `use_uuid=False`, fixed `photo{ext}` name

### Step 3 — Centralize the `upload_finalize.py` per-entity dispatch

Replace the two `isinstance` chains (`_check_permission`, `_mark_content_object_ready`) with a single registry keyed by content-object model class (e.g. a dict mapping `TreasurePhoto`/`CharacterPhoto`/`GameItemPhoto`/`CharacterItemPhoto` to their permission-check + ready-side-effect callables, with `GamePhoto`/default falling through as today). Behavior must stay identical — this is a structural change only, not a permissions change.

### Step 4 — Tests

- Add unit tests for `normalize_path_segment` and `PhotoPathBuilder` covering: spaces/linebreaks → `_`, accented letters → ASCII, emoji/non-ASCII stripped, each listed invalid character removed, the stem/extension dot preserved, and `use_uuid=True/False` behavior.
- Update the existing tests for all five upload-init endpoints (see Files to Change) to exercise a slug/filename that needs sanitizing, asserting the resulting `file_path` is normalized as expected, in addition to keeping existing assertions passing.
- Confirm `games/tests/views/upload_finalize_test.py` still passes unchanged (dispatch centralization must not alter behavior).

## Files to Change

- `backend/games/photo_path.py` — new: `normalize_path_segment` + `PhotoPathBuilder`
- `backend/games/tests/photo_path_test.py` — new: unit tests for the above
- `backend/games/views/photo_upload.py` — use `PhotoPathBuilder`
- `backend/games/views/game/_photo_upload.py` — use `PhotoPathBuilder`
- `backend/games/views/game/_item_photo_upload.py` — use `PhotoPathBuilder`
- `backend/games/views/games/game_item_photo_upload.py` — use `PhotoPathBuilder`
- `backend/games/views/treasures/treasure_photo_upload.py` — use `PhotoPathBuilder`
- `backend/games/views/upload_finalize.py` — replace `isinstance` chains with a per-type registry
- `backend/games/tests/views/photo_upload_test.py` — add sanitization-path assertions
- `backend/games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py` and `.../npcs/detail/game_npc_photo_upload_test.py` — add sanitization-path assertions
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_photo_upload_test.py` and `.../npcs/detail/items/game_npc_item_photo_upload_test.py` — add sanitization-path assertions
- `backend/games/tests/views/games/game_item_photo_upload_test.py` — add sanitization-path assertions
- `backend/games/tests/views/treasures/treasure_photo_upload_test.py` — add sanitization-path assertions
- `backend/games/tests/views/upload_finalize_test.py` — verify unchanged behavior after dispatch centralization

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`, covers the new `games/tests/photo_path_test.py`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- `CharacterDocumentPhoto` and `GameDocumentPhoto` have models but no upload-init endpoint yet — out of scope, but `PhotoPathBuilder` should be usable as-is if/when those endpoints are added later.
- `character_id`, `item_id`, `treasure_id`, and the `pcs`/`npcs` "kind" segment are not attacker-influenced free text (numeric PKs or a fixed literal) — normalizing them is harmless but not the actual risk this issue addresses; `game_slug` and the filename stem are the two segments that matter.
