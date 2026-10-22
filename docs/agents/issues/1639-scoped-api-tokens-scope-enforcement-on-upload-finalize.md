# Issue: Scoped API tokens: scope enforcement on upload finalize

## Description

Sub-issue of #1603 (epic #1592). Enforce scoped API token scopes on the upload finalize endpoint, following the Uploads section of [`docs/agents/access-control/token-scopes.md`](https://github.com/darthjee/majora/blob/main/docs/agents/access-control/token-scopes.md#uploads). The blockers (#1616 and the #1603 core) are closed.

`PATCH uploads/<type>/<id>.json` (`upload_finalize` in `backend/uploads/views.py`, URL name `upload-finalize`) is the only route whose resource is not in the URL, so it is the one check done inside a view instead of in `ApiTokenAuthentication` / `TokenScopeCheck`.

## Problem

`upload-finalize` is still in `PENDING_TOKEN_SCOPES`, so every scoped token gets `403` `token_not_allowed` on it. An automation can start an upload (the init routes are declared) but cannot finish it. A static `@token_scopes` declaration cannot express the rule, because the needed family depends on the upload's `content_object`, and the URL has no `game_slug` for the game list check.

## Expected Behavior

For a request authenticated by a scoped `ApiToken`:

- The required scopes come from the upload's `content_object` through a fixed model → scopes map. Each entry matches the scopes of the init route that created the upload:

  | `content_object` model | Required scopes | Game |
  |---|---|---|
  | `GamePhoto` | `games:write` | the photo's game |
  | `CharacterPhoto` | `pcs:write` or `npcs:write`, following `character.npc` | the character's game |
  | `CharacterItemPhoto` | `pcs:write`/`npcs:write` **and** `items:write` | the character's game |
  | `GameItemPhoto` | `items:write` | the item's game |
  | `GamePossessionPhoto` | `possessions:write` | the possession's game |
  | `GameCommonItemPhoto` | `common_items:write` | the common item's game |
  | `GameFactionPhoto` | `factions:write` | the faction's game |
  | `GameDocumentPhoto`, `GameDocumentFile`, `GameDocumentFilePhoto` | `documents:write` | the document's game |
  | `TreasurePhoto` | `treasures:write` | `treasure.game_id` (none for catalogue treasures) |
  | `SourcePhoto`, `StlModelPhoto`, `CollectionPhoto` | `miniatures:write` | none |

- A missing scope gives `403` `scope_missing`.
- A token with a non-empty game list whose list does not include the object's game gives `403` `game_not_allowed` (`accounts.token_games.check_token_game`). Objects with no game skip this check.
- Uploads with a staff or copy origin (`upload.is_staff_origin` / `is_copy_origin`) give `403` `token_not_allowed`.
- A `content_object` model missing from the map gives `403` `token_not_allowed` (fail closed).
- The existing checks (X-Upload-Token, owner, expiry, status, per-type role check) still run. The token never grants more than its owner has.
- Session and legacy `Token` requests behave exactly as today.

## Solution

- Declare `@token_scopes(PATCH=[])` on `upload_finalize`, with a comment saying the empty list only lets scoped tokens reach the view and the real scope check runs inside it. Remove `upload-finalize` from `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`. If this is the last sub-issue of #1603 to land, delete the set.
- Add the in-view check to `backend/uploads/` (for example a small `UploadTokenScopeCheck` class next to the finalizers). It runs only when `request.auth` is an `ApiToken`, after the upload lookup and the X-Upload-Token / owner checks, and before the per-type permission check. It raises the existing `ScopeMissing` / `GameNotAllowed` / `ApiTokenNotAllowed` exceptions, so the error bodies stay the same.
- Add a test that every model in `_PHOTO_HANDLERS` (plus `GamePhoto`) has a map entry, so a new upload type cannot be added without a scope rule.
- Update the Uploads and Enforcement sections of `docs/agents/access-control/token-scopes.md` (and `upload.md` if needed) to show the final map and that the check is done.

### Acceptance criteria

- Tests show that finalize gets its family from the linked object (at least a PC photo vs. an NPC photo, a character item photo, and one non-character type). They also cover a missing scope (`scope_missing`), a wrong game (`game_not_allowed`), a catalogue treasure / miniatures upload with no game check, and a rejected staff-origin and copy-origin upload (`token_not_allowed`).
- The owner-role intersection still applies: a non-editor's token that has the scope still gets `403`.
- Session and legacy-token behaviour does not change.

## Benefits

- Scoped-token automations (the Majora client) can finish the uploads they start, so the photo and file upload wrappers (#1623) work end to end.
- One of the last items on `PENDING_TOKEN_SCOPES` is removed, which moves #1603 toward deleting the set.
