# Game Content Copy — Copy Flow

Part of the [Game Content Copy](../game-content-copy.md) spec. Describes the DB copy phase, the
copy rules shared by every content type, and the backend copy API. The link phase that follows it
is in [hard-links.md](hard-links.md).

## Overview

1. Staff select a source game, a target game and one or more source entities
   ([page.md](page.md)).
2. For **each** entity, one request copies it in the database (this page). Copied photo/file rows
   are created hidden (`ready=false`), each with a copy-origin `Upload`.
3. For each such `Upload`, the proxy hard-links the source file to the copy's new path and
   finalizes it ([hard-links.md](hard-links.md)).

## DB copy phase

- One `POST staff/copies/<type>/<id>.json` `{target: <slug>}` per entity, run in **one
  transaction**: the source is read inside the transaction (its current state is copied) and the
  copy plus every associated row (photos, files, sub-rows defined by each tab page) is created, or
  nothing is.
- Photo/file rows of the copy are created with `ready=false`. Every listing already filters on
  `ready=True`, so they stay invisible until linked.
- Only source photos/files with `ready=true` are copied; not-ready ones are skipped.
- A `GameDocumentFile`'s `photo` FK is set to its copied photo row at copy time (it is not a
  cover and its finalize does nothing, like the regular flow).
- For each copied photo/file row, one copy-origin `Upload` is created (see
  [hard-links.md](hard-links.md#upload-extension)): `origin='copy'`, `status='pending'`, `user` =
  the requesting staff member, `source_path` = the source row's path, `file_path` = the new path
  under the target game, `is_cover` = whether the source row was its owner's cover.
- The response lists the pending links by record id and type only — **never server paths**.

## Copy rules

### `copied_from`

- Each copyable model (`GameItem`, `GameCommonItem`, `GameRecipe`, `GameDocument`, `GameFaction`,
  `GamePossession`) gets a nullable `copied_from` FK to itself, `on_delete=SET_NULL`: the copy
  survives the deletion of its source.
- The source list's `copied_to_target` flag is derived from it: true when some entity of the
  target game has `copied_from` = this source row.
- Copying a flagged row again (after confirmation on the page) is allowed and creates another
  copy.
- `copied_from` is provenance only, staff-visible: it is never exposed by regular or restricted
  game serializers (it could leak an entity id from another domain or a hidden one). It is nulled
  when the source is deleted, including through the source game's deletion. The implementation
  issues document it in the product entity pages (`game-item.md`, `game-document.md`,
  `game-recipe.md`, and the faction/common item/possession pages once they exist).

### Same-game references

Apart from `copied_from`, a copy never references a row of another game. Each tab page defines
how its in-game FKs are resolved in the target (e.g. #1554 for `GameRecipe.game_common_item`).

### Character links and history

The copy is created with **no** character links: `CharacterItem`, `CharacterFaction`,
`CharacterRecipe`, `CharacterDocument` and `CharacterPossession` rows pointing to the source are
never copied or re-pointed. Historical (`versioning`) records of the source are not copied
either; the copy starts a fresh history.

### Names

Name clashes with existing target entities are allowed, except where a unique constraint exists:
factions (`unique_faction_name_per_game`) → `422`
`{"errors": {"name": ["unique"]}}`, nothing created. `422` is chosen deliberately, as for other
staff-view conflicts (regular faction create/update answer `400` with the same `unique` code).

### `hidden`

The copy keeps the source's `hidden` value (all copyable models except `GameFaction`, which has
none).

### Cover photo

For models with a cover `photo` FK (recipes have none), the copy's cover `photo` FK stays null at copy time, even when the source has one. It is set by
the finalize of the matching photo's link (`is_cover`, see
[hard-links.md](hard-links.md#finalize)). The per-type `mark_ready` cover handlers do not apply
to copies.

## API

Backend endpoints of the copy phase. All are `.json`, staff/superuser only, and send
`X-Skip-Cache: true` (see [permissions.md](permissions.md)). The link endpoints are in
[hard-links.md](hard-links.md#api).

| Method & path | Purpose |
|---|---|
| `GET staff/copies.json` | Tab index: the available content types, in tab order (like `staff/photos.json`). |
| `GET staff/copies/games.json` | Every game across all domains, for the selectors: `[{slug, name, domain_groups}]`, games without a domain group included. |
| `GET staff/copies/<type>.json?from=<slug>&to=<slug>` | Paginated source list of the tab; each row carries `copied_to_target`. |
| `POST staff/copies/<type>/<id>.json` `{target: <slug>}` | Copy one entity (one transaction). |

`POST staff/copies/<type>/<id>.json` responses:

- `201` — `{id: <new entity id>, links: [{upload_id, upload_type, token}]}` (paths never
  included).
- `400` — missing/unknown `target`, or `target` is the source's own game.
- `404` — unknown `<type>`, or the source entity no longer exists (or is not in a game).
- `422` — validation error, e.g. faction name already used in the target game.

The `201` response also carries `X-Cache-Clear` for the target game's stale paths, cleared on
every domain (see [permissions.md](permissions.md#cache)).

The list endpoint answers `400` when `from` or `to` is missing/unknown or both are the same
game. Per-type row fields are defined by the tab pages.

## Edge cases

- **Source upload not ready**: source photos/files with `ready=false` are skipped.
- **Source entity gone**: the copy request returns `404`; the page reports that entity as failed
  and refreshes the list.
- **Source file gone before its link**: handled like any link failure — the copied row stays
  pending with `error=source_missing`, visible on the page for retry
  ([hard-links.md](hard-links.md#failures)).
- **Target game / copied entity deleted while links are pending**: cascade deletes remove the
  copied rows and, through the cleanup below, their `Upload`s. A later link request
  returns `404` and the page drops it. No file was ever written for unlinked rows.
- **`Upload` cleanup**: `Upload` points to its row through a `GenericForeignKey`, so deletes
  don't cascade. Deleting a copied photo/file row (or its game) deletes its copy-origin
  `Upload`s explicitly (`pre_delete` hook filtered on `origin='copy'`); no `GenericRelation`, so
  regular/staff uploads keep today's behavior (see
  [hard-links.md](hard-links.md#upload-extension)).
- **Large documents**: a document with many files is still copied in one transaction; the
  transaction only writes rows (no file I/O), so its duration stays bounded by the row count.
