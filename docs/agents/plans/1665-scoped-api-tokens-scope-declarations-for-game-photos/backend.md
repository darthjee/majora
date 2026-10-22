# Backend Plan: Scoped API tokens: scope declarations for game photos

## Overview

`game-photos` (`GET games/<slug>/photos.json`) becomes a public read (`GET=[]`) and
`game-photo-upload` (`POST games/<slug>/photo_upload.json`) needs `games:write`. With both
declared, `PENDING_TOKEN_SCOPES` is empty, so it and its pending-only tests are deleted and the
coverage test becomes a plain "declared or excluded" check. The access-control doc drops every
mention of the pending list.

## Context

Sub-issue of #1603 (epic #1592) and the last of its sub-issues: #1630–#1639 and #1662 have
merged, and #1666/#1669 were closed as duplicates. Upload finalize for `GamePhoto` is already
mapped to `games` by #1639 (`backend/uploads/upload_token_scope_check.py`), so it needs no change.

## Steps

- [01 — Declare scopes on the game photo views](backend/01-declare-game-photo-scopes.md)
- [02 — Delete PENDING_TOKEN_SCOPES](backend/02-delete-pending-token-scopes.md)
- [03 — Add scoped-token tests](backend/03-add-scoped-token-tests.md)
- [04 — Update token-scopes.md](backend/04-update-token-scopes-doc.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_rest`, `pytest_all`)
- `backend`: `poetry run ruff check .` inside the tests container (CI job: `checks`)
- `docs`: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- `check_game_edit` still runs as the token owner, so a token cannot do more than its owner.
- The game-list check applies to the public read too (`game_slug` route), so a token limited to
  another game gets `403 game_not_allowed` on `photos.json`.
- Order of checks is excluded prefix → declaration → `scope_missing` → `game_not_allowed`, so the
  wrong-game test must carry `games:write`.
