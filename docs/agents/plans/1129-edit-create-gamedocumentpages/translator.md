# Translator Plan: Edit/Create GameDocumentPages

Main plan: [plan.md](plan.md)

## Shared contracts

None directly — this agent adds translation keys that `frontend`'s new components (`DocumentPagesEditBox`, `DocumentPagesSaveFailedAlert`, the new "Edit" affordance in `DocumentPagesBox`) reference via `Translator.t(...)`. Coordinate on exact key names with the frontend plan ([frontend.md](frontend.md)) if they diverge from what's proposed below.

## Implementation Steps

### Step 1 — New keys under the `document_page`/`document_edit_page` namespaces
Existing pages-related strings live in `frontend/assets/i18n/en/document_page.yaml` (show page) and `document_new_page.yaml` (create-time fields, including the existing `photo_upload_failed`/`retry_photo_upload`/`skip_photo_upload` trio this issue's save-failure alert mirrors). There's no dedicated `document_edit_page.yaml` yet — `GameDocumentEdit` currently reuses `document_page`'s namespace (e.g. `document_page.loading`). Add new keys there (or a new `document_edit_page.yaml` if `frontend` prefers a dedicated namespace once building it — confirm with them) for:
- The "Edit"/pages-edit-mode entry-point affordance (both the `DocumentPagesBox` show-page link and the in-place edit-mode toggle on the edit page)
- "Cancel" (exiting pages edit mode)
- The live "total pages" counter label
- The save-failure alert: message + "Retry" + "Skip" labels (mirroring `document_new_page.photo_upload_failed`/`retry_photo_upload`/`skip_photo_upload`'s wording style, but for the pages save saga instead of a photo upload)

### Step 2 — Mirror every key across all locales
Add the same keys to both `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/` (the only two locales configured) — translated content for `pt`, not just copied English strings.

### Step 3 — Verify sync
Run this repo's translation-key sync-check script (the one referenced in this agent's own scope) to confirm every new key exists, with the same shape, across both locales before considering this done.

## Files to Change
- `frontend/assets/i18n/en/document_page.yaml` (or a new `document_edit_page.yaml`) — new keys
- `frontend/assets/i18n/pt/document_page.yaml` (or its `document_edit_page.yaml` counterpart) — new keys, translated

## Notes
- Depends on `frontend` finalizing exact component/key names first (Step 4 in [frontend.md](frontend.md)) — coordinate before finalizing key names here, since this plan's proposed names are a starting point, not a hard contract.
