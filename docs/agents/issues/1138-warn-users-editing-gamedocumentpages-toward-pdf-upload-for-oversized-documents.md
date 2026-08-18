# Warn users editing GameDocumentPages toward PDF upload for oversized documents

## Context

Issue #1129 (edit/create GameDocumentPages, sub-issue 5/5 of #1124) settled on an
infinite-textarea editing approach: the frontend auto-splits content into pages using a
fixed character-per-page budget, and shows a live "total pages" counter above the editor.

The parent issue (#1124) flagged that very large documents are cumbersome to edit this way
client-side, and that in those cases the player should be steered toward uploading a PDF
instead. However, the exact size/page-count threshold that should trigger this hint, and
the visual format used to communicate it, were deliberately left undecided in #1129 — to be
explored and matured separately rather than block #1129's landing.

This issue exists to make and implement that decision: a soft, non-blocking UX nudge that
tells the player "this document is getting large, consider uploading it as a PDF instead"
once their content crosses a reasonable size/page threshold.

The relevant pieces already in place from #1129:

- `PagesSplitter.BUDGET = 4000` (`frontend/assets/js/utils/PagesSplitter.js`) is the
  characters-per-page budget used both for the real split and for the live estimate.
- The live "total pages" counter is rendered in `DocumentPagesEditBoxHelper.#renderEditor`
  (`frontend/assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditBoxHelper.jsx`,
  ~lines 44-64): a `<div class="d-flex justify-content-end mb-1">` wrapping a
  `<span class="text-muted">`, with the count computed by
  `#pageCount(value) = Math.max(1, Math.ceil(value.length / PagesSplitter.BUDGET))`. No
  conditional styling exists on it yet.
- The existing PDF upload entry point is document-level, not page-editor-level: an
  `UploadButton` (accepting `.pdf`, via `FileUploadModal`) rendered in
  `DocumentDetailHelper.jsx`
  (`frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx`,
  ~lines 98-102), wired up in `GameDocument.jsx`. There is currently no cross-reference
  between the page editor and this button.

## Decisions

- **Threshold**: 10 pages (~40,000 characters) by default, but extracted into a build-time
  configurable constant (e.g. a Vite env var) rather than hardcoded, so it can be tuned per
  deployment without a code change. Falls back to the 10-page default when the build-time
  value isn't set.
- **Visual format**: a style change on the existing live page-count counter only — no
  separate banner. Past the threshold, the counter switches to a warning style (e.g.
  Bootstrap's warning color) instead of its current muted style.
- **Call to action**: the warning-styled counter links to / triggers the existing PDF
  upload action (the `UploadButton` in `DocumentDetailHelper.jsx`), so the nudge is
  actionable rather than purely informational.

## What needs to be done

- **Frontend**: extract the page-count threshold into a build-time configurable constant
  (default: 10 pages), used alongside `PagesSplitter.BUDGET`.
- **Frontend**: in `DocumentPagesEditBoxHelper`, switch the counter's styling from
  `text-muted` to a warning style once `#pageCount(value)` crosses the threshold.
- **Frontend**: wire the warning-styled counter to link to / trigger the existing PDF
  `UploadButton` flow from `DocumentDetailHelper.jsx` / `GameDocument.jsx`.
- **Frontend**: add/update Jasmine specs covering: counter styling below the threshold,
  counter styling at/above the threshold, the link/trigger to the upload action, and that
  none of this blocks save actions.
- **i18n**: add any new translation keys needed for the hint copy (e.g. tooltip or
  accessible label on the warning-styled counter), in coordination with the `translator`
  agent.
- **Docs**: update `docs/agents/` (architecture/flow or a relevant plan doc) to record the
  chosen threshold, its build-time configurability, and rationale, so future changes to
  `PagesSplitter.BUDGET` can re-evaluate it consistently.

## Acceptance criteria

- [ ] The page-count threshold (default 10 pages) is a build-time configurable constant
      with a documented default, not a hardcoded magic number.
- [ ] The live page-count counter in the GameDocumentPage editor switches to a warning
      style once content crosses the threshold, and stays in its normal style below it.
- [ ] The warning-styled counter links to / triggers the existing PDF upload action.
- [ ] The hint is purely advisory: it never prevents saving or continuing to edit via the
      textarea.
- [ ] Frontend specs cover the below-threshold, at/above-threshold, and CTA-link
      behaviors.
- [ ] Any new UI copy is added to all translation files with key parity verified.
- [ ] `docs/agents/` is updated to reflect the decided threshold/format.
