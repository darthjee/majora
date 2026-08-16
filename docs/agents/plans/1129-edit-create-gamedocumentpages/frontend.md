# Frontend Plan: Edit/Create GameDocumentPages

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint table, permission split, and `version` field semantics. This agent consumes backend's four new regular/restricted endpoint pairs and the `version` field now present on `GameDocumentPageListSerializer`'s read payload.

## Implementation Steps

### Step 1 — `gameDocumentPageConfig.js` mutation entries
Extend `frontend/assets/js/utils/requests/config/gameDocumentPageConfig.js` with `POST`/`PATCH`/`DELETE` blocks mirroring the existing `GET` shape (`regular`/`private`, `private` keyed off `permission: 'can_edit'`) for: create (`collection`, POST), update (needs a `pageId` param, PATCH), trim (`collection`, DELETE), bump (`collection`, PATCH — pick whatever `quantityType` key reads clearly, e.g. `bumpVersion`).

### Step 2 — `RequestPermissionResolvers` entries
Add resolver entries for the new `gameDocumentPage` mutation quantityTypes, following the existing entries for this resource and the project's documented convention (`docs/agents/issue-enhancement.md`): mutations pass an explicit `variantName` derived from an already-resolved `RequestStore`/`RequestPermissionResolvers` check, not a fresh ad-hoc `AccessStore` call.

### Step 3 — Split algorithm util
New pure util (e.g. `frontend/assets/js/utils/PagesSplitter.js`), implementing the save-time split decided in the issue: cut at the character budget, snap backward to the nearest line break; if none, snap to the nearest space; if the candidate lands inside an odd count of preceding ` ``` ` fences, nudge to the nearer fence boundary instead. Pure/stateless (text in, page-content-array out) so it's unit-testable without any component wiring — mirrors how `DocumentPagesBoxController.resolveMostVisiblePage` is kept pure for the same reason.

### Step 4 — Pages-edit component
New component owning its own edit-mode state, e.g. `frontend/assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditBox.jsx` (+ controller/helper, mirroring `DocumentPagesBox`'s own controller/helper split):
- Read-only by default; an "Edit" affordance switches it into edit mode.
- Entering edit mode fetches the document's full current content (all pages, not paginated) plus its current `version`, concatenates it into the `MarkdownEditor` textarea's initial value.
- Renders `MarkdownEditor` (reuse as-is, no changes needed there) plus a live "total pages" counter (blind estimate: `content.length / budget`, no smart splitting) positioned above-right of the editor.
- "Cancel" discards in-progress changes and exits edit mode without touching anything else.
- Exposes a single save entry point (e.g. an imperative handle via `forwardRef`/`useImperativeHandle`, matching how `GameDocumentEdit`'s save handler needs to call into it unconditionally) that:
  - No-ops immediately (resolved promise) when not in edit mode.
  - Otherwise: runs `PagesSplitter` (Step 3) against the textarea value, diffs the result against the currently-loaded page set to know which pages changed/are new, and fires the saga — individual PATCH/POST calls (via `RequestStore.mutate`, `variantName` from Step 2) for changed/new pages, then the two bulk calls (trim, bump-version) from `plan.md`'s contract table.

### Step 5 — Wire into `DocumentPagesBox` (show page) as the entry points
- Add a permission-gated "Edit" link (navigating to `#/games/:game_slug/documents/:id/edit`) inside `DocumentPagesBox`/`DocumentPagesBoxHelper`, visible alongside existing segments.
- Fix `DocumentPagesBoxHelper.render`'s current `return null` for zero pages: when the caller can edit, render the same "Edit" affordance instead of nothing; keep returning `null` only when the caller can't edit and there's nothing to show.
- The permission flag driving this comes from the same place `GameDocument.jsx`'s `canUploadPhoto` already comes from (`AccessStore.ensureGameAccess`), threaded down as a new prop — `DocumentPagesBox` is otherwise resource-agnostic and shouldn't fetch its own permissions.

### Step 6 — Wire into `GameDocumentEdit`
- Render the Step 4 component (read-only pages preview when not editing, the full editor when in edit mode).
- Save handler: save document fields first (unchanged from today's photo-upload-only behavior — actually, this issue doesn't add document-field editing either, so "save document fields" here is really just the existing flow), then unconditionally call the pages component's save entry point from Step 4.
- On pages-saga failure after a successful document-level step, show a new alert component (e.g. `DocumentPagesSaveFailedAlert.jsx`, mirroring `DocumentNewPhotoUploadFailedAlert.jsx`'s shape) with **Retry** (re-invoke the same save entry point — it naturally resumes from wherever the diff currently stands) and **Skip** (dismiss, leave pages as-is).

### Step 7 — CharacterDocument page permission + entry point
- `CharacterDocumentDetailController`: add an independently-fetched `canEditPages` derivation (mirroring `GameDocumentEditController#loadCanUploadPhoto` — same `is_superuser || is_staff || is_dm || is_player` shape via `AccessStore.ensureGameAccess`), since this page currently has none.
- `CharacterDocumentDetailHelper`/`CharacterDocumentPagesBox`: thread the new flag down to `DocumentPagesBox` the same way `game_slug`/`game_document_id` are already threaded — no other change needed, since `DocumentPagesBox` already carries the edit-navigation link (Step 5) and it's resource-agnostic.

## Files to Change
- `frontend/assets/js/utils/requests/config/gameDocumentPageConfig.js` — new mutation entries
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — new resolver entries
- `frontend/assets/js/utils/PagesSplitter.js` — new pure split util
- `frontend/assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditBox.jsx` (+ `controllers/DocumentPagesEditBoxController.js`, `helpers/DocumentPagesEditBoxHelper.jsx`) — new
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPagesBox.jsx` / `DocumentPagesBoxHelper.jsx` / `DocumentPagesBoxController.js` — edit-entry-point affordance, zero-pages fix, new permission prop
- `frontend/assets/js/components/resources/document/pages/GameDocumentEdit.jsx` / `controllers/GameDocumentEditController.js` / `helpers/GameDocumentEditHelper.jsx` — render the editor, save orchestration, failure alert wiring
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPagesSaveFailedAlert.jsx` — new, mirrors `DocumentNewPhotoUploadFailedAlert.jsx`
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterDocumentDetailController.js` / `helpers/CharacterDocumentDetailHelper.jsx` — new `canEditPages` derivation and prop threading
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBox.jsx` — thread the new permission prop through
- Matching Jasmine spec files under `frontend/specs/` for every new/changed file above

## CI Checks
- `frontend`: `npm test` / `npm run lint` (check `.circleci/config.yml` for exact frontend job commands)

## Notes
- No changes needed to `MarkdownEditor`/`MarkdownEditorHelper` — reused as-is per the issue's decision.
- The live page counter is a blind estimate on purpose (content length ÷ budget); only the actual save-time split (Step 3) needs the smarter line/space/fence-aware logic.
- Concurrent-edit staleness is explicitly not guarded against (see issue's "Edge cases" section) — no version-check-before-save added here.
