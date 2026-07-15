# Plan: Character view overhauling

Issue: [524-character-view-overhauling.md](../../issues/524-character-view-overhauling.md)

## Overview

Rework the Character show, new (NPC creation), and edit pages to use a consistent 2-column layout, matching the `col-md-4`/`col-md-8` convention already established by the Game show page (`GameHelper.jsx`). Several sections currently inline or bundled together (Profile Avatar, DM Notes, Role+Description) become standalone components, each with distinct read-only (show) and editable (edit/new) variants. Treasures moves from a full-width block into the right column on the show page; Photos stays full-width at the bottom. Both preview sections replace their plain "See all" link with a card-styled grid cell (gem icon for Treasures, camera icon for Photos), reusing a new shared `SeeAllCard` component rather than inventing a full `PhotoCard`.

Single agent involved: **frontend** (pure `frontend/` work, no new API surface — the one required backend capability, accepting `links` on NPC creation, already exists in `CharacterCreateSerializer`).

## Context

Current state (confirmed by exploration):
- Show page (`CharacterHelper.jsx:62-100`): `col-md-4` (avatar, name, `LinkList`, `CharacterMoney`) + `CharacterInfo` (`col-md-8`, Role+Description combined). DM Notes (`#renderPrivateDescription`, lines 236-245) and Treasures/Photos previews render full-width below the row.
- Edit page (`BaseCharacterEditHelper.jsx:54-102`, shared by NPC/PC via `NpcCharacterEditHelper.jsx`/`PcCharacterEditHelper.jsx`): same `col-md-4`/`col-md-8` shape, but avatar/links/money/role/description/DM notes are all inline private methods, duplicated from (not shared with) the show page's rendering.
- New page (`GameNpcNewHelper.jsx`): flat form, no columns, no avatar, no links — `GameNpcNewController.js:78-87`'s POST payload has no `links`/photo field either, even though `CharacterCreateSerializer` (`backend/games/serializers/characters/character_create.py:16,31,48-53`) already accepts and persists `links` on creation. Avatar upload is architecturally scoped to an existing character id (`backend/games/urls/npcs.py:36-38`, `game_npc_photo_upload.py:15-18`) — matching this app's existing precedent (Game creation has no avatar field either) — so it cannot be added to the New page.
- `CharacterInfo.jsx` + `CharacterInfoHelper.jsx` bundle Role and Description into one component; the issue wants them separate.
- `CharacterTreasuresPreviewHelper.jsx:31` already reuses `TreasureCard`; `CharacterPhotosPreviewHelper.jsx:27` uses inline `CardPhoto` markup with no dedicated card component. Both end with a plain `<a>{Translator.t('character_preview_section.see_all')...}</a>` link (no new i18n needed — same key/text is reused).

Confirmed decisions (from issue discussion):
- Treasures moves into the right column on the show page; Photos remains a full-width section below the columns.
- New page gets Profile Avatar (static placeholder, no upload) + Links (new, backend-supported) in the left column; Role + Description + DM Notes in the right column. Money/Treasures/Photos are excluded.
- Each section is built as a distinct read-only (show) component and a distinct editable (edit/new) component, rather than one shared component with an edit-mode flag — matching the existing show/edit architectural split.
- Role and Description become two separate components.

## Implementation Steps

### Step 1 — Add the `gem` icon constant
In `frontend/assets/js/utils/ui/Icons.js`, add `gem: 'bi-gem'` alongside the existing `camera: 'bi-camera-fill'`.

### Step 2 — Extract show-page components (Avatar, DM Notes, Role, Description)
Create, following the existing `<Name>.jsx` + `helpers/<Name>Helper.jsx` pattern used by `CharacterMoney`/`CharacterTreasuresPreview`:
- `CharacterAvatar.jsx` + `helpers/CharacterAvatarHelper.jsx` — extract `CharacterHelper.#renderPicture`, `#buildSecondaryButtons`, `#buildDmSecondaryButtons`, `#buildPlayerSecondaryButtons` (lines 139-228) as-is, taking `character` and `handlers` as props.
- `CharacterDmNotes.jsx` + `helpers/CharacterDmNotesHelper.jsx` — extract `#renderPrivateDescription` (lines 236-245).
- `CharacterRole.jsx` + `helpers/CharacterRoleHelper.jsx` — extract `CharacterInfoHelper.#renderRole` (lines 30-37).
- `CharacterDescription.jsx` + `helpers/CharacterDescriptionHelper.jsx` — extract `CharacterInfoHelper.#renderDescription` (lines 45-48).
- Delete `CharacterInfo.jsx` and `CharacterInfoHelper.jsx` once nothing references them (confirm with a repo-wide grep before removing).

### Step 3 — Extract edit-page components (Avatar, Links, Money, Role, Description, DM Notes)
Still inside `BaseCharacterEditHelper.jsx`, extract each inline block into its own component (props take the relevant slice of `state`/`handlers` rather than the whole objects, following existing prop-drilling conventions in this codebase):
- `CharacterAvatarField.jsx` + helper — the `ActionsOverlay` block (lines 64-70). Design it to also serve the New page's static placeholder: when `canEdit` is false and no `onClick`/`url` are given, `ActionsOverlay` already renders a non-interactive default picture, so no separate "placeholder" variant is needed.
- `CharacterLinksField.jsx` + helper — `LinkList` + "Edit links" button (lines 72-79).
- `CharacterMoneyField.jsx` + helper — `#renderMoneyField` (lines 220-241), wrapping `CharacterMoney` + edit button + `FieldErrors`.
- `CharacterRoleField.jsx` + helper — `#renderRoleField` (lines 183-200).
- `CharacterDescriptionField.jsx` + helper — the `TextareaField` description block (lines 86-92).
- `CharacterDmNotesField.jsx` + helper — `#renderPrivateDescriptionField` (lines 202-218).
- Allegiance and slain fields (`#renderAllegianceFields`, `#renderSlainField`) stay as-is — the issue does not mention them, and they are NPC-only concerns outside the general section list.

### Step 4 — Rebuild the show page layout
In `CharacterHelper.jsx`, replace the current `row` with:
- `col-md-4`: `CharacterAvatar`, `<h1>{character.name}</h1>`, `LinkList`, `CharacterMoney`.
- `col-md-8`: `CharacterRole`, `CharacterDescription`, `CharacterDmNotes`, `CharacterTreasuresPreview` (moved here from its current full-width position).
Keep `CharacterPhotosPreview` full-width below the row, unchanged in position.

### Step 5 — Rebuild the edit page layout
In `BaseCharacterEditHelper.jsx`, replace the inline blocks in the existing `row` with the Step 3 components:
- `col-md-4`: `CharacterAvatarField`, name field (`#renderNameField`, unchanged), `CharacterLinksField`, `CharacterMoneyField`, then the untouched allegiance/slain fields.
- `col-md-8`: `CharacterRoleField`, `CharacterDescriptionField`, `CharacterDmNotesField`, then the submit button (unchanged).

### Step 6 — Build the New (NPC creation) page's 2-column layout
In `GameNpcNewHelper.jsx`:
- Wrap the top of the form in a `row` with `col-md-4` (reusing `CharacterAvatarField` with `canEdit={false}` and no `url`/`onClick` for the static placeholder, plus a links editor reusing `CharacterLinksField`/`LinksEditModal` against a local `links` array in form state) and `col-md-8` (existing Role/Description/DM Notes fields, reusing `CharacterRoleField`/`CharacterDescriptionField`/`CharacterDmNotesField` from Step 3).
- Keep Money (raw number `FormField`), Hidden, Allegiance, and Public Allegiance fields below the columns, unchanged — they have no display/breakdown equivalent to componentize at creation time.
- In `GameNpcNewController.js:78-87`, add `links: formValues.links` to the `createNpc` payload (the backend already accepts and persists it — see `CharacterCreateSerializer`).
- Add `links` to the page's form state (initial value `[]`) and thread it through the same `onOpenLinksModal`/links-modal-controller pattern already used by the edit page (`LinksEditModalController.js`), scoped to local state only since there's no character id yet.

### Step 7 — Move Treasures into the right column
Since `CharacterTreasuresPreview` already renders its own `mt-4` wrapper, verify its spacing still reads correctly nested inside `col-md-8` under `CharacterDmNotes`; adjust the wrapper margin if needed once rendered.

### Step 8 — Card-styled "See all" entries for Treasures and Photos
Create a new shared `common/SeeAllCard.jsx` + `helpers/SeeAllCardHelper.jsx` component (props: `icon`, `text`, `href`), matching the grid-cell shape already used by `TreasureCard`/the inline Photos card (`col-6 col-sm-4 col-md-3 col-lg-2 mb-4` + `card h-100`), rendering the given bootstrap icon centered where a photo would go and the given text as a stretched link to `href`.
- `CharacterTreasuresPreviewHelper.jsx:36-58` (`#renderBody`): append a `SeeAllCard` (icon `Icons.gem`, text from the existing `character_preview_section.see_all` key, href `seeAllHref`) after the mapped `TreasureCard`s, and drop the trailing `<a>` link (line 31).
- `CharacterPhotosPreviewHelper.jsx:32-48` (`#renderBody`): same treatment with `Icons.camera`, appended after the mapped photo cards, dropping the trailing `<a>` link (line 27).
- Only render the `SeeAllCard` when the corresponding preview list is non-empty and/or always (per current "See all" link behavior, which renders regardless of list length) — keep existing behavior of always showing the "See all" entry.

## Files to Change
- `frontend/assets/js/utils/ui/Icons.js` — add `gem` icon constant.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterAvatar.jsx` + `helpers/CharacterAvatarHelper.jsx` — new, show-page avatar.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterDmNotes.jsx` + `helpers/CharacterDmNotesHelper.jsx` — new, show-page DM notes.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterRole.jsx` + `helpers/CharacterRoleHelper.jsx` — new, show-page role.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterDescription.jsx` + `helpers/CharacterDescriptionHelper.jsx` — new, show-page description.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterInfo.jsx`, `helpers/CharacterInfoHelper.jsx` — remove once superseded.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterAvatarField.jsx`, `CharacterLinksField.jsx`, `CharacterMoneyField.jsx`, `CharacterRoleField.jsx`, `CharacterDescriptionField.jsx`, `CharacterDmNotesField.jsx` (+ each `helpers/*Helper.jsx`) — new, edit/new-page field components.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — rebuild layout (Step 4).
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx` — rebuild layout (Step 5).
- `frontend/assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx` — add 2-column layout + links editor (Step 6).
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js` — send `links` in the creation payload.
- `frontend/assets/js/components/common/SeeAllCard.jsx` + `helpers/SeeAllCardHelper.jsx` — new, shared "see all" grid-cell card.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterTreasuresPreviewHelper.jsx` — use `SeeAllCard` instead of trailing link.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx` — use `SeeAllCard` instead of trailing link.
- Corresponding spec files under `frontend/specs/.../character/...` — add/update specs for every new/changed component (existing suite already splits helpers into per-concern spec files, e.g. `CharacterHelperSlainSpec.js`; follow that convention rather than one monolithic spec per helper).

## CI Checks
- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — should be a no-op here since no new translation keys are introduced (the existing `character_preview_section.see_all` key is reused).

## Notes
- No backend changes needed beyond wiring the frontend to send `links` on NPC creation — the API already supports it.
- Avatar upload on the New page is intentionally out of scope (static placeholder only); adding real upload-at-creation would require a backend redesign and was explicitly ruled out during issue discussion.
- Watch for other callers of `CharacterInfo`/`CharacterInfoHelper` before deleting them (a repo-wide grep found none besides `CharacterHelper.jsx` at discussion time, but re-verify at implementation time since the codebase may have moved on).
- `BaseCharacterEditHelper` already unifies NPC/PC edit rendering (via `NpcCharacterEditHelper.jsx`/`PcCharacterEditHelper.jsx` thin instances), so Steps 3 and 5 only need to touch the shared base, not per-type duplicates.
