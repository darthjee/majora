# Issue: Move DocumentPagesBox to the right column on document show/edit pages

## Description

On `GamePage`-related document pages, the document's pages content (`DocumentPagesBox` on show, `DocumentPagesEditBox` on edit) is in the wrong place. It should render on the right side of the page, for both the show and edit views.

Affected pages:
- `/#/games/:game_slug/(n)pcs/:id/documents/:id` (character document show)
- `/#/games/:game_slug/documents/:id` (game document show)
- `/#/games/:game_slug/documents/:id/edit` (game document edit)

## Problem

`ShowPageLayout` renders each document page as a two-column row (`left`/`right`) followed by a full-width `bottom` area. The document's own pages content — `DocumentPagesBox` on the `GameDocument` show page, `DocumentPagesEditBox` on the `GameDocument` edit page, and `CharacterDocumentPagesBox` on the PC/NPC `CharacterDocument` show page — currently renders in that `bottom` area, disconnected from the description it belongs with. On the edit page specifically, `DocumentPagesEditBox` (plus its page-level Save button and `DocumentPagesSaveFailedAlert`) renders entirely outside `ShowPageLayout`, in its own container below the whole layout.

## Expected Behavior

The document's pages content renders inside the `right` column (`col-md-8`), below the existing description, on all three affected pages/modes:
- `GameDocument` show
- `GameDocument` edit (including the Save button and `DocumentPagesSaveFailedAlert`, which move together with the pages editor)
- `CharacterDocument` (PC/NPC) show — no edit mode exists for this resource

The `left`/`right` column split stays 4/8 — only which slot renders the pages content changes. The `bottom` area keeps the files/photos preview shortlists, unchanged in presence and order. No other pages (e.g. document creation/`new`) are affected — they never rendered pages content in the first place.

## Solution

The page layout (`ShowPageLayout`) is a two-column row (`left`/`right`) plus a `bottom` full-width area. Currently the document's pages content renders in `bottom`. It should move into the `right` column (`col-md-8`) instead, below the existing description:

- **`documentShowType`** (`GameDocument` show/edit): `DocumentPagesBox`/edit-mode pages content moves from `bottom` into `right`, ordered after `DescriptionBox`.
- **`characterDocumentShowType`** (PC/NPC `CharacterDocument` show — no edit mode exists here): `CharacterDocumentPagesBox` moves the same way, from `bottom` into `right`, after `DescriptionBox`.
- **Edit page (`GameDocumentEdit`/`GameDocumentEditHelper`)**: `DocumentPagesEditBox` currently renders entirely outside `ShowPageLayout`, in its own container below the whole layout, alongside the page-level Save button and `DocumentPagesSaveFailedAlert`. All three (pages editor, Save button, failure alert) move together into `documentShowType.right`'s `Edit` variant, so they end up grouped in the right column instead of below the full layout.
- `bottom` still keeps the files/photos preview shortlists (`DocumentFilesPreview`/`DocumentPhotosPreview`, `CharacterDocumentFilesPreview`/`CharacterDocumentPhotosPreview`) — only the pages content itself moves.

## Benefits

- Groups the document's actual content (its pages) together with its description in a single column, instead of splitting it awkwardly across the page.
- Keeps the edit page's pages editor, Save button, and failure alert visually associated with the document fields they act on, instead of floating in a separate container below the full layout.
