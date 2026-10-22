# Backend Plan: Scoped API tokens: scope enforcement on upload finalize

Main plan: [plan.md](plan.md)

## Overview
`PATCH uploads/<type>/<id>.json` (`upload_finalize`, URL name `upload-finalize`) has no resource and no `game_slug` in its URL, so `TokenScopeCheck` cannot enforce it. Declare `@token_scopes(PATCH=[])`, which only lets scoped tokens reach the view, and enforce the real scopes and game list inside the view through a fixed model → scopes map. Sessions and legacy `Token` requests must behave exactly as today.

## Context
- Rules: `docs/agents/access-control/token-scopes.md` (sections Uploads, Per-game restriction, Enforcement).
- Existing building blocks: `accounts.authentication` (`ScopeMissing`, `GameNotAllowed`, `ApiTokenNotAllowed`), `accounts.scopes.effective_scopes`, `accounts.token_games.check_token_game` / `token_game_ids`, `Upload.is_staff_origin` / `is_copy_origin`.
- Each map entry must match the scopes of the init route that created the upload (e.g. `game_pc_item_photo_upload` declares `['pcs:write', 'items:write']`).
- Decisions agreed in the issue discussion: `PATCH=[]` + an in-view check; `CharacterItemPhoto` mirrors its init route; the check runs after the X-Upload-Token / owner / expiry / status checks and before the per-type role check.

## Steps

- [01 — Add the upload token scope check](backend/01-upload-token-scope-check.md)
- [02 — Wire it into finalize and declare the view](backend/02-wire-into-finalize.md)
- [03 — Tests](backend/03-tests.md)
- [04 — Update the access-control docs](backend/04-docs.md)

## CI Checks
- `backend`: run `pytest uploads/ accounts/tests/` and `ruff`/flake8 through the backend tests container (`make tests`, then the commands inside it). The CI jobs are the backend pytest jobs in `.circleci/config.yml` (working directory `backend`).

## Notes
- `GameDocumentFilePhoto` has no FK to its file. Resolve the game the same way `_document_file_photo_permission` does (`GameDocumentFile.objects.get(photo=...)`). If that lookup fails, fail closed with `token_not_allowed`.
- `TreasurePhoto` on a catalogue treasure (`treasure.game_id is None`) and the miniatures photos have no game, so `check_token_game` passes them.
- Miniatures, collections and sources keep `require_staff`, so a non-staff owner's token that has `miniatures:write` still gets `403` from the role check.
- If #1665 and #1666 have already landed when this ships, `upload-finalize` is the last pending entry: delete `PENDING_TOKEN_SCOPES` and its uses in the coverage test, and drop the "pending" wording from the docs.
