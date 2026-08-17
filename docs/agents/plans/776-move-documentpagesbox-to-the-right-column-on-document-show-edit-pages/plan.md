# Plan: Move DocumentPagesBox to the right column on document show/edit pages

Issue: [776-move-documentpagesbox-to-the-right-column-on-document-show-edit-pages.md](../../issues/776-move-documentpagesbox-to-the-right-column-on-document-show-edit-pages.md)

## Overview

Purely a frontend layout change: relocate the document "pages" content (`DocumentPagesBox`, the edit-mode pages editor, `CharacterDocumentPagesBox`) from `ShowPageLayout`'s full-width `bottom` slot into its `right` column, below the description, on `GameDocument` show/edit and PC/NPC `CharacterDocument` show.

See [frontend.md](frontend.md) for the full plan.
