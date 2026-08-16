# Revisit atomicity of GameDocumentPage saves (mixed-version state during/after a failed save)

## Context

Issue #1129 (edit/create `GameDocumentPage`s) added a document-wide `version` column on `GameDocumentPage` plus a separate history table, so that a failed or partially-failed pages-save saga can be manually recovered from — the history gives back the pre-save content for every page, keyed by `game_document` + `order` + `version`.

That mechanism only gives **resumability** (retry naturally picks up wherever a previous attempt left off, since the saga always re-derives its diff from current live state) and **recoverability** (manual restoration from history), not **atomicity**. Pages are still updated in place across many individual requests (per-page PATCH/POST for changed/new pages, a bulk delete for shrinkage, a bulk version-bump for untouched pages). Because of that, a reader hitting the document mid-save, or after a save partially fails, can observe a mixed-version state: some pages already on the new version, others still on the old one, with no guarantee the document renders as a coherent single version at any given moment.

This gap was explicitly accepted as a known limitation when #1129 was matured (see `docs/agents/issues/1129-edit-create-gamedocumentpages.md`, "Partial saga failure (decided)"), mitigated only by reusing the existing Retry/Skip alert pattern from the photo-upload saga convention (`PhotoUploadSaga`, `DocumentNewPhotoUploadFailedAlert` and its item/faction/npc/possession siblings). It was deliberately left unsolved there to keep that issue's scope tight, with the intent to revisit it separately once the feature has shipped and the in-place-update approach can be evaluated against real usage.

## What needs to be done

Revisit whether stronger consistency is worth the added cost, and land on a direction (which may be "keep the current approach") rather than leaving the gap open indefinitely.

- **Discussion/maturation**: weigh the current in-place-update approach (simple, but allows a reader to observe a mixed-version document during/after a partial save) against a full-recreate-plus-atomic-pointer-flip design:
  - Create an entirely new set of `GameDocumentPage` rows for the new version (rather than updating existing rows in place).
  - Once all new-version pages exist, atomically flip a single `current_pages_version` pointer field on `GameDocument` so readers only ever see a complete version — never a partial one.
  - Consider the read-side impact: `game_document_pages.py` / `game_document_pages_all.py` would need to filter by `current_pages_version` instead of treating the live table as the single source of truth for "current" content.
  - Consider cost/trade-offs: extra storage churn (every save writes a full new set of pages, on top of the existing history-table archiving from #1129), garbage-collection of orphaned old-version rows (or reuse of the existing history table instead of a second archival mechanism), and whether the added complexity is justified given #1129's saga is already "last write wins" with no optimistic-concurrency guard.
- **Backend**: if the pointer-flip design is chosen, implement the schema change (`current_pages_version` on `GameDocument`), the new-version-then-flip save flow, and update the read endpoints to filter by the pointer.
- **Frontend**: adjust the pages-save saga (built in #1129) if the request shape needs to change to support create-new-set-then-flip instead of in-place per-page updates.
- **Docs**: update `docs/agents/issues/1129-edit-create-gamedocumentpages.md`'s "Partial saga failure (decided)" note (or a follow-up doc) once a direction is chosen, so the accepted-limitation note doesn't go stale.

This issue depends on #1129 landing first, since it revisits and builds on the versioning/history mechanism introduced there. Related: #1129, #1124.

## Acceptance criteria

- [ ] TODO
