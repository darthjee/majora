# Issue: Scoped API tokens: scope declarations for documents

## Description

Sub-issue of #1603 (epic #1592). Declare token scopes on the `documents` family: every view under `games/<slug>/documents…` (documents, photos, files, pages, `bump_version`, uploads and photo set).

Each view must declare `@token_scopes` for every HTTP method it serves, following the family table and the read/write rules in [`docs/agents/access-control/token-scopes.md`](https://github.com/darthjee/majora/blob/main/docs/agents/access-control/token-scopes.md):

- public (`AllowAny`) reads: `GET=[]`;
- restricted reads (`all.json` / `full.json` and other permission-gated reads): `documents:read`;
- writes: `documents:write`, plus `read` on any other family whose restricted data they touch.

**Blocked by:** #1616 and the #1603 core (catalogue, decorator, auth-class check, coverage test with a pending list). Both have landed; #1631 (PCs) and #1632 (NPCs) are the reference implementations.

## Solution

Declare `@token_scopes` on the views behind these URL names in `backend/games/urls/games.py` and remove them from `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`:

- Documents: `game-documents`, `game-documents-all`, `game-document-detail`, `game-document-detail-full`
- Photos: `game-document-photos`, `game-document-photos-all`, `game-document-photo-upload`, `game-document-photo-set`
- Files: `game-document-files`, `game-document-files-all`, `game-document-file-upload`, `game-document-file-photo-upload`
- Pages: `game-document-pages`, `game-document-pages-all`, `game-document-page-detail`, `game-document-page-detail-all`, `game-document-pages-bump-version`, `game-document-pages-bump-version-all`

Uploads and photo set create or change `GameDocumentPhoto` / `GameDocumentFile` records, so they need `documents:write`. The document serializers embed no other family, so no cross-family `read` is expected; confirm per view during implementation.

Out of scope:

- `game-document-pc-summary(-all)` and `game-document-npc-summary(-all)`: already declared by #1631 / #1632.
- Upload finalize (`PATCH uploads/<type>/<id>.json`): #1639.
- `permissions/game_document.json` (`permissions-game-document`): stays pending, like `permissions/game/pc.json` and `npc.json` in #1631 / #1632, so all the per-entity `permissions/game_*.json` routes can be declared together in one issue (e.g. #1630).

Update `docs/agents/access-control/token-scopes.md` to say the documents family is declared.

## Acceptance criteria

- Every view listed above declares its scopes for every method and is removed from the pending list.
- Per-family tests cover: a missing scope (403 `scope_missing`), a wrong game (403 `game_not_allowed`), a public read without scopes, a restricted read, uploads, and the owner-role intersection (a scope never lets a token exceed its owner).
- Session and legacy-token behaviour does not change.
- If this is the last sub-issue of #1603 to land, delete the pending list.
