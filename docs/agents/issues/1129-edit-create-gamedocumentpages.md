# Issue: Edit/Create GameDocumentPages

## Problem
`GameDocumentPage`s can already be read and browsed (sibling read-side sub-issues), but there is no way to create or edit them yet.

## Solution
Adds create/edit for `GameDocumentPage`s, covering:

- An edit entry point, part of the pages component (button in the show-page box built in the sibling frontend sub-issues)
- The "Edit GameDocumentPages" link on the CharacterDocument show page, which redirects to the GameDocument's edit page (there's no concept of CharacterDocumentPages — editing always happens through the underlying GameDocument) — see "CharacterDocument → GameDocument edit behavior" below
- Rendering: like character description, edit supports markdown with a preview option — see "Markdown rendering/preview" below
- Permissions for create/edit — see "CharacterDocument → GameDocument edit behavior" below for the confirmed regular/restricted split

### Editing approach
Of the two designs the parent issue raised, this issue goes with the **infinite text area**, not the per-page boxes. Rationale: the read side already treats pages as invisible to the reader — "internally, we can have internal boxes that have no UI to distinguish when a page ends and another begin" (parent issue #1124) — so writers shouldn't be forced to think in pages either, which is exactly what the per-page-boxes design would require ("forcing the user to choose which text goes in which page").

- **Splitting**: the frontend auto-splits the single text blob into pages by a fixed character-per-page budget — no manual page-break marker. There is no existing length convention to reuse: `GameDocumentPage.content` is an unbounded `TextField` with no `max_length` at the model or migration level, and no other description-like field in the codebase (`GameDocument.description`, `Character.public_description`/`private_description`, etc.) defines one either. The actual budget number is a planning-time decision.
- **Steering toward PDF upload** for very large documents is a soft UX hint left to human judgment, not a hard limit that blocks saving — the concrete threshold/visual format is split into follow-up issue #1138.
- **Save saga request shape**: individual PATCH/POST requests only for pages whose content actually changed or are newly created (carrying the new content and new version), followed by two bulk requests: one to delete any pages beyond the new count (the "ideally in a single request specifying how many pages to keep" case from the parent issue), and one to batch-bump the version of every remaining page *not* otherwise touched by this save. See "Page versioning & history" below for why the version bump exists and how it's batched. None of these bulk endpoints exist yet; all are new backend surface for planning.

### Edit entry point
Both entry points land on the existing `GameDocumentEdit` page (`#/games/:game_slug/documents/:id/edit`), which today is photo-upload-only — `name`/`description` are displayed there but not editable yet, only the upload button is interactive:

1. The document-level "Edit" button already on the `GameDocument` show page (`GameDocument.jsx`), gated on `canUploadPhoto` ("there is no separate general edit permission for documents") — unchanged, already reaches this page regardless of page count, so it covers the create case (a document with zero pages) for free.
2. A second, pages-box-local entry point inside `DocumentPagesBox` (the show-page component), for convenience when scrolled deep into the content without needing to scroll back up. Since `DocumentPagesBoxHelper.render` currently returns `null` whenever a document has zero pages, this needs its own always-visible (permission-gated) affordance for the zero-pages case too — not just something attached alongside existing segments. Both the read display and the edit affordance/edit-mode live in the same component (not a separate bolted-on element).

**Edit mode on the edit page is opt-in**, to avoid an unrelated edit (e.g. renaming the document) accidentally triggering the whole pages saga:

- Pages render read-only by default on `GameDocumentEdit`. The user must explicitly enter "pages edit mode" before any page saga logic is wired up.
- Entering pages edit mode fetches the document's full current content (all pages concatenated into one blob) up front, seeding the infinite textarea — distinct from the show page's paginated one-page-at-a-time loading. Accepted as a deliberate, reasonable cost of choosing to edit pages.
- There's a single "Save" action on the edit page. If pages edit mode was never entered, save only touches document-level fields — no page reads/writes, no page-history churn from an unrelated edit.
- A "Cancel" action exits pages edit mode, discarding in-progress textarea changes, without affecting the rest of the document form.

**Save orchestration**: the pages component owns its own edit-mode/cancel state privately (mirroring how `DocumentPagesBoxController` already owns all show-page box state) and exposes a single save entry point. `GameDocumentEdit`'s save handler doesn't inspect pages state at all — it always saves document fields first, then unconditionally delegates to the pages component's own save entry point, which internally either runs the full saga (if in edit mode) or immediately resolves as a no-op (if not). Parent stays ignorant of pages state; the component is the single source of truth.

See "Edge cases" below for how these interact with save orchestration.

### CharacterDocument → GameDocument edit behavior
Since `DocumentPagesBox` already carries the edit-navigation link (decided above) and `CharacterDocumentPagesBox` is already a thin wrapper that remaps `game_document_id` → `id` and delegates entirely to the resource-agnostic `DocumentPagesBox`, the "redirect to the underlying GameDocument's edit page" behavior falls out for free — no extra wiring needed for the link/navigation itself.

Two things this surfaces that do need building:

- **Permission gating is currently absent on the CharacterDocument page.** `CharacterDocumentDetailHelper`/`CharacterDocumentDetailController` explicitly have no edit route and no `canEdit`/`canUploadPhoto`-style derivation today (`CharacterDocument` "has nothing left to edit"). Showing/hiding the pages-edit link there needs a new, independently-fetched permission check on this page (mirroring `GameDocumentEditController`'s own `#loadCanUploadPhoto`, since the page is reachable directly by URL, not only via a show page that already gated it).
- **Create/edit permission rule (confirmed)**: any player or staff may edit/create pages through the **regular** endpoint, which rejects edits to pages of a *hidden* game document (mirroring the existing read-side pairing: `game_document_pages.py` excludes hidden documents, `game_document_pages_all.py` doesn't). DMs and admins use the **restricted** endpoint instead, which does accept hidden documents (mirrors `check_game_edit` + `X-Skip-Cache` on `game_document_pages_all.py`, and the existing `EndpointPermission(...).check(request, 'game_document', 'restricted', 'edit')`-style pattern used by `GameDocument`'s own PATCH). Link/affordance *visibility* is gated the same broad way as `canUploadPhoto` (`is_superuser || is_staff || is_dm || is_player`); which endpoint variant a save actually calls is a separate, later concern resolved at request time.
- **Back-navigation stays simple**: after editing via a CharacterDocument-originated link, the edit page's back button still always returns to the GameDocument show page (`#/games/:game_slug/documents/:id`), same as today — no CharacterDocument-aware back-href introduced.

### Markdown rendering/preview
Reuse the existing `MarkdownEditor` component as-is for the pages "infinite textarea" — it's already a generic, single-value write/preview field (id/label/value/onChange/errors), the same shape already used for `DocumentDescriptionField`, `GameDescriptionField`, `PossessionDescriptionField`, and `ItemDescriptionField`. Its preview mode already renders through the exact same `ReactMarkdown` + `remarkBreaks` setup `DocumentPagesBoxHelper` uses on the show page, so the preview will match the eventual read view exactly. No new markdown/preview rendering logic is needed — the pages-specific concerns (edit-mode entry, splitting, save saga) just wrap around it as a plain value/`onChange` consumer.

- Above the editor box, on the right, show a live "total pages" counter — purely derived from the textarea's current length against the character-per-page split budget, recomputed on every change, no extra request.
- The "steer toward PDF upload for oversized documents" hint (size threshold + visual alert format) is deliberately **out of scope for this issue** — split into follow-up issue #1138 so the threshold/format can be experimented with independently, rather than blocking this issue's maturation. #1138 depends on this issue landing first (it hooks into the page-count indicator and character-per-page budget built here).

### Edge cases

**Split-boundary safety**. The live "total pages" counter above the editor stays a blind estimate (content length ÷ character budget) — no smart logic needed there. The actual save-time split is smarter, in priority order:
1. From the budget-character mark, scan backward to the nearest preceding line break and cut there — keeps inline markdown (bold/italic/links/inline code) intact, since those are virtually always single-line.
2. If no line break exists before the mark (a single paragraph itself spans more than a page), fall back to the nearest preceding space instead — accepted as "nothing more we can do" for that pathological case; the paragraph's flow breaks, but at least not mid-word.
3. Fenced code blocks (` ``` `) get one more check: count ` ``` ` occurrences in the content up to the candidate split point — an odd count means the candidate lands inside an open fence. When that happens, nudge the split to whichever fence boundary (the opening or the closing ` ``` `) is closer to the original target, so a page never ends with an unterminated code block. A single fenced block itself bigger than a page budget falls into the same accepted "nothing we can do" bucket as an oversized paragraph.
4. Lists and blockquotes are explicitly *not* special-cased — splitting across their boundaries still renders as valid markdown (just visually resumes as a separate list/quote), so there's no broken-markup failure mode to guard against there.

**Concurrent edits / stale page count**: no new guarding machinery. The codebase has no existing optimistic-concurrency convention anywhere (checked: no `version`-as-lock/ETag/If-Match pattern on any model prior to this issue). Since the saga's first step always re-derives its diff from whatever the current live state is, a save is naturally self-correcting on retry even under a race — accepted as "last write wins" for the rare case of two people editing the same document's pages at once, consistent with keeping scope tight elsewhere in this issue.

**Partial saga failure**: reuses an existing codebase pattern rather than inventing a new one. When a document-level save succeeds but the pages saga (partially or fully) fails, show the same "created but a deferred step failed" warning alert already used for photo-upload sagas (see `PhotoUploadSaga`, `DocumentNewPhotoUploadFailedAlert` and its item/faction/npc/possession siblings) — **Retry** and **Skip** actions. Retry needs no special partial-resume logic: since the saga always re-checks current page state as its first step, simply re-running the same save operation naturally resumes from wherever the previous attempt left off. Skip dismisses the alert and leaves pages in their current (possibly partial) state; the user can always re-enter pages edit mode later to fix it up manually.

Note this only gives resumability, not atomicity: because pages are still updated in place (not via a full-recreate-plus-pointer-flip), a reader hitting the document mid-save (or after a partial failure) could see a mixed-version state — some pages already on the new version, others still on the old one. The versioning/history mechanism below gives manual recoverability of lost content, not a guarantee that saves are invisible until complete.

### Page versioning & history
Every `GameDocumentPage` gets a `version` column, shared document-wide as a generation counter — **all** pages of a document move to the same new version number together on every save, not just the ones whose content actually changed. Freshly created pages start at version 1.

- A separate history table archives each page's pre-save state before it's overwritten or removed, keyed by `game_document` + `order` + `version` — deliberately **not** a hard foreign key to the live `GameDocumentPage` row, since that row can be deleted entirely (e.g. when the page count shrinks) and its history should survive independently of the live row's lifecycle. History rows are written for every page on every save (touched or not), so each version maps to one complete, consistent, easily-queryable set — "give me the whole document as it looked at version N" is a single query against history, no stitching across tables needed.
- Recovery from history is **manual**, not automated — this issue doesn't build an "undo"/"restore" UI, just the data model that makes manual recovery possible later.
- Because the backend already holds the current DB content for every page, it can archive/copy it into history server-side regardless of what the client's request payload contains — the individually-PATCHed pages carry their new content in the request, but the archiving itself doesn't depend on the client resending anything.
- This is why the saga's final step is a **batch bump-version endpoint**: rather than one short PATCH per untouched page (`{version: N}`, no content), a single bulk request bumps every page not otherwise touched by this save — keeping total request count roughly proportional to how much of the document actually changed, not to its total page count, consistent with the "many small requests + bulk requests for the rest" shape already established for deletion.
- Storage grows by roughly the size of the whole document on every save (since every page gets archived every time, even unchanged ones), and old versions are kept indefinitely (no automatic pruning). Accepted trade-off, given #1138 already exists to nudge people away from editing very large documents directly.
- Read endpoints are unaffected: since the live table is still the single source of truth for "current" content (versioning here is bookkeeping + history, not a filtered-read pointer scheme), the already-shipped read endpoints (`game_document_pages.py` / `game_document_pages_all.py`, from the sibling read-side sub-issues) don't need to change.
- Still needs a data migration to backfill `version=1` on every existing `GameDocumentPage` row created by the sibling read-side sub-issues before this one lands.
- The lack of save atomicity (mixed-version state visible mid-save/after a partial failure) is accepted for this issue; revisiting it (e.g. a full-recreate-plus-atomic-pointer-flip alternative) is split into follow-up issue #1139.

### Out of scope
- General `GameDocument` field editing (name/description/hidden) on `GameDocumentEdit` — that page stays photo-upload-only for those fields, same as today; this issue only adds the pages editor to it.
- The "steer toward PDF upload for oversized documents" size hint — split into #1138.
- Stronger save-atomicity/consistency guarantees — split into #1139.
- Any "undo"/"restore from history" UI — the versioning/history data model is built here, but restoring from it is a manual, out-of-band operation for now.

### Testing / performance / security
Not matured here — left to the planning/implementation phase to work out concretely against the decisions above (regular-vs-restricted endpoint coverage, the split-boundary and version-bump logic, the save-orchestration delegation, and the history table's write cost).

### Notes
This is sub-issue 5/5 of #1124, covering both frontend and backend for the edit/create side. It depends on the read-side sub-issues (backend model + endpoints, frontend show-page components) landing first, since editing builds on the same `GameDocumentPage` model and pagination endpoints. Sibling sub-issues:
- Backend: `GameDocumentPage` model + read endpoints
- Frontend: `DocumentPagesBox` component wired into the GameDocument show page
- Frontend: reuse of `DocumentPagesBox` on the CharacterDocument show page
- Cache: navi config update for the new paginated `pages` sub-resource

Parent issue: #1124
