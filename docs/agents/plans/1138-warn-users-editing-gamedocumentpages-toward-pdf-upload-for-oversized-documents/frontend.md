# Frontend Plan: Warn users editing GameDocumentPages toward PDF upload for oversized documents

Main plan: [plan.md](plan.md)

## Shared contracts

- Must use the i18n key `document_edit_page.pages_count_warning_hint` (added by translator) as
  the `title`/accessible label on the warning-styled counter link once translator's PR/commit
  lands. Do not invent a different key name.

## Context

- `PagesSplitter.BUDGET = 4000` (`frontend/assets/js/utils/PagesSplitter.js`) is the
  characters-per-page budget, reused by the live counter's blind estimate.
- The counter is rendered in `DocumentPagesEditBoxHelper.#renderEditor`
  (`frontend/assets/js/components/resources/document/pages/elements/edit/helpers/DocumentPagesEditBoxHelper.jsx`,
  lines ~44-64): a `<div class="d-flex justify-content-end mb-1">` wrapping a
  `<span class="text-muted">`, with `#pageCount(value) = Math.max(1, Math.ceil(value.length /
  PagesSplitter.BUDGET))`.
- `DocumentPagesEditBox.jsx` (the component calling this helper) already receives `gameSlug` and
  `id` as props — both are needed to build the document's show-page href
  (`#/games/${gameSlug}/documents/${id}`).
- The PDF upload button/modal (`PhotoUploadModal` configured with `accept=".pdf"`) exists **only**
  on the document **show** page (`GameDocument.jsx` + `DocumentDetailHelper.jsx`), not on the
  edit page. The edit page (`GameDocumentEdit.jsx`) has its own upload modal wiring, but it's for
  the document's *photo* field only (`document`/`single` endpoint) — there is no PDF upload modal
  on the edit page to trigger in-place.
  - **Decision**: implement the "link to the upload action" requirement as a real navigation
    link (`<a href="#/games/{gameSlug}/documents/{id}">`) from the edit page to the show page,
    where the PDF upload button is already fully wired — rather than duplicating a second PDF
    upload modal instance onto the edit page. This satisfies "link to the upload action" (issue's
    clarifying answer) with the smallest, most consistent change. If this reads as insufficient
    once reviewed, escalate rather than silently building a second modal.
- MajoraLogger.js already establishes the `import.meta.env?.VITE_*` pattern for build-time
  configurable values (`frontend/assets/js/utils/logging/MajoraLogger.js`, `VITE_FRONTEND_LOG_LEVEL`).
  Follow the same pattern for the new threshold.

## Implementation Steps

### Step 1 — Build-time configurable threshold constant

Add a new constant, e.g. in `PagesSplitter.js` (or a small sibling module if that reads cleaner,
your call) — something like:

```js
const DEFAULT_WARNING_THRESHOLD_PAGES = 10;
export const PAGE_WARNING_THRESHOLD = Number(import.meta.env?.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD)
  || DEFAULT_WARNING_THRESHOLD_PAGES;
```

Falls back to `10` whenever the env var is unset, empty, or not a valid number (mirroring
`Number(...) || default` short-circuiting on `0`/`NaN`).

### Step 2 — Warning style on the counter past the threshold

In `DocumentPagesEditBoxHelper.#renderEditor`, compute `pageCount` once, compare it against the
threshold, and switch the span's class from `text-muted` to a warning style (e.g.
`text-warning fw-bold`, matching whatever reads clearly against this codebase's existing warning
usages — check `DocumentPagesSaveFailedAlert.jsx`'s `alert-warning` for the palette already in
use) when `pageCount >= threshold`.

### Step 3 — Link to the document show page once past the threshold

Still in `#renderEditor` (now needs `gameSlug`/`id` passed down from `DocumentPagesEditBox.jsx`
through to the helper — add them to the `render`/`#renderEditor` signatures): when past the
threshold, wrap the counter text in an `<a href={`#/games/${gameSlug}/documents/${id}`}>` (or an
equivalent already-established internal-link helper if one exists in this codebase — check for
one before hand-rolling the hash path) with `title={Translator.t('document_edit_page.pages_count_warning_hint')}`
and a matching `aria-label`. Below the threshold, render the plain (non-link) `span` exactly as
today — no behavior change for documents that stay small.

### Step 4 — Confirm no save-path impact

Read through `DocumentPagesEditBoxController.save` and `GameDocumentEdit.jsx`'s `handleSave` to
confirm this change touches rendering only, not save orchestration — it should require zero
changes there. Call this out explicitly if it turns out not to be true.

### Step 5 — Jasmine specs

Update/add specs (likely `specs/.../DocumentPagesEditBoxHelper.spec.js` or the box's own spec —
follow whatever existing spec file already covers `#renderEditor`) covering:
- Counter renders as plain `text-muted` span below the threshold (e.g. at `threshold - 1` pages).
- Counter renders with the warning style and as a link to the show page at/above the threshold.
- The link's `href`, `title`, and `aria-label` are correct given a sample `gameSlug`/`id`.
- Save still proceeds normally regardless of threshold state (no new blocking behavior).
- The threshold constant honors a stubbed `import.meta.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD`
  override as well as its default-10 fallback when unset.

## Files to Change

- `frontend/assets/js/utils/PagesSplitter.js` — add the `PAGE_WARNING_THRESHOLD` constant (or a
  new sibling module, if preferred).
- `frontend/assets/js/components/resources/document/pages/elements/edit/helpers/DocumentPagesEditBoxHelper.jsx` —
  warning-style + link logic in `#renderEditor`.
- `frontend/assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditBox.jsx` —
  thread `gameSlug`/`id` through to the helper if not already passed (they're already props of
  this component, so this should just be an extra call argument, not new prop plumbing).
- Relevant Jasmine spec file(s) under `frontend/specs/.../document/pages/...` for the above.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until translator's key
  lands in every locale; coordinate merge order or land together.

## Notes

- The exact warning color/class and exact link-wrapping markup are implementation judgment calls
  within "read as guidance, not an error" — no react-bootstrap `<Alert>` is needed here since the
  chosen format is a style change on the existing counter only (no separate banner).
- Double-check whether an existing internal-hash-link helper/component exists in this codebase
  before hand-building the `#/games/.../documents/...` href string, to stay consistent with
  whatever convention already exists for this kind of in-app navigation link.
