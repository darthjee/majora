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

## What needs to be done

- **Decide the threshold**: pick a size/page-count value (e.g. a specific total-page count,
  or a byte/character size) above which the hint should appear. The threshold should be
  informed by whatever character-per-page budget #1129 lands with, and should reflect a
  point at which client-side textarea editing genuinely becomes unwieldy (not an arbitrary
  low number).
- **Decide the visual format**: choose how the hint is communicated — for example, a style
  change on the existing live page-count indicator (e.g. warning color past the threshold),
  a separate dismissible banner near the editor, or another treatment. The result must read
  as guidance, not an error, and must never block saving or editing.
- **Frontend**: implement the chosen threshold check and visual treatment in the
  GameDocumentPage editor introduced by #1129, reusing the existing live page-count state
  where possible.
- **Frontend**: add/update Jasmine specs covering the hint appearing above the threshold and
  staying hidden below it, and confirming it does not block save actions.
- **i18n**: add any new translation keys needed for the hint copy, in coordination with the
  `translator` agent.
- **Docs**: update `docs/agents/` (architecture/flow or a relevant plan doc) to record the
  chosen threshold and rationale, so future changes to the character-per-page budget can
  re-evaluate it consistently.

## Acceptance criteria

- [ ] A concrete size/page-count threshold for the "consider uploading a PDF" hint is
      decided and documented.
- [ ] A concrete visual format for the hint is decided and documented.
- [ ] The hint appears in the GameDocumentPage editor once content crosses the threshold,
      and is absent below it.
- [ ] The hint is purely advisory: it never prevents saving or continuing to edit via the
      textarea.
- [ ] Frontend specs cover both the "hint shown" and "hint hidden" states.
- [ ] Any new UI copy is added to all translation files with key parity verified.
- [ ] `docs/agents/` is updated to reflect the decided threshold/format.
