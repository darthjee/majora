# Plan: Warn users editing GameDocumentPages toward PDF upload for oversized documents

Issue: [1138-warn-users-editing-gamedocumentpages-toward-pdf-upload-for-oversized-documents.md](../issues/1138-warn-users-editing-gamedocumentpages-toward-pdf-upload-for-oversized-documents.md)

## Overview

Add a soft, non-blocking nudge to the GameDocumentPage editor (`DocumentPagesEditBox`, from
#1129): once the live page-count estimate crosses a build-time configurable threshold (default
10 pages, ~40,000 characters at `PagesSplitter.BUDGET = 4000`), the existing "N pages" counter
switches from its current muted style to a warning style and becomes a link to the document's
show page, where the existing PDF upload button already lives. Purely visual/CTA — no change to
save behavior.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- New i18n key: `document_edit_page.pages_count_warning_hint` (no placeholders) — English
  value: `This document is getting large — consider uploading it as a PDF instead.` Used by
  frontend as the `title`/accessible label on the warning-styled counter link. Must be added to
  every locale under `frontend/assets/i18n/<lang>/document_edit_page.yaml` with key parity
  (`npm run check_i18n` enforces this in CI).
