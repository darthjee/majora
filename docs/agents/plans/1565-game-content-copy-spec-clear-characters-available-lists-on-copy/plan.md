# Plan: Game content copy spec: clear characters' available lists on copy

Issue: [1565-game-content-copy-spec-clear-characters-available-lists-on-copy.md](../../issues/1565-game-content-copy-spec-clear-characters-available-lists-on-copy.md)

## Overview

Docs-only change to the Items, Documents and Factions tab pages under
`docs/agents/specs/game-content-copy/`. Their **Cache** sections must also clear every target
character's `<type>/available.json` list on the copy `201` and on the cover link's finalize,
matching what `possessions.md` already does for possessions.

## Context

- `character_items_available`, `character_documents_available` and
  `character_factions_available` (`backend/games/views/game/{items,documents,factions}/_*_exchange.py`)
  cache their response unless the character is a hidden NPC (`X-Skip-Cache`), exactly like
  `character_possessions_available`.
- The `<type>/available/all.json` views (`build_*_available_all_view` under
  `backend/games/views/game/_character/`) always send `X-Skip-Cache`.
- The list rows (`GameItemListSerializer`, `GameDocumentListSerializer`,
  `GameFactionListSerializer`) are `id`, `name`, `photo_path`. The copy `201` adds a row, and the
  cover finalize sets `photo_path`. The other document finalizes (non-cover photos, files, file
  photos) don't change the row.
- Common items have no per-character available list, and recipe available lists are always
  `X-Skip-Cache`, so `common-items.md` and `recipes.md` stay unchanged.
- Reference wording: `possessions.md`'s intro paragraph (lines 8–10), **Cache** section
  (lines 91–115) and **Testing** backend bullet (lines 134–142).

## Steps

- [01 — Items page](plan/01-items-page.md)
- [02 — Documents page](plan/02-documents-page.md)
- [03 — Factions page](plan/03-factions-page.md)

## CI Checks

- repo root: `docker-compose run --rm markdownlint` (CI job: `markdownlint`).

## Notes

- No code changes. Implementing the cache clearing in the backend belongs to the epic's
  implementation issues, which use these pages.
- Keep the lines within the existing wrap width (~100 chars) so `markdownlint` passes.
