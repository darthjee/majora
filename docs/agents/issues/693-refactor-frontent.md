# Issue: Refactor Frontend

## Description
Reduce complexity in the frontend codebase (`frontend/`) by fixing a batch of concrete refactor candidates: duplicated logic, oversized classes/methods, inline anonymous functions, oversized component JSX, complex logic embedded directly in components instead of delegated to a controller, and oversized loop bodies.

A frontend-focused codebase survey was performed during discussion of this issue and found 12 concrete, file/line-anchored cases (spanning ~19 individual occurrences) that fit these categories. Most of the codebase already follows a consistent Controller/Helper split and a `#renderX` private-method convention, so the found cases are the genuine outliers rather than a general rewrite.

## Problem

### 1. Duplication (highest-value category)

1. **Repeated `response.ok ? response.json() : Promise.reject(new Error(...))` idiom** — 14+ call sites across 10 files, e.g. `frontend/assets/js/utils/access/store/AccessStorePermissions.js:159-160`, `AccessStoreAccess.js:139-140`, `AccessStoreAdmin.js:96-97`, `.../game/pages/controllers/GamePollController.js:159-160,182-183,204-205,210-211`, `.../game/pages/elements/controllers/PollCloseModalController.js:73-74`, `.../game_session/pages/controllers/GameSessionController.js:66-67`, `.../staff_user/pages/controllers/StaffUserController.js:82-83`, `.../account/pages/controllers/MyAccountController.js:94-95`, `.../treasure/pages/controllers/TreasureController.js:66-67`, `.../common/base/controllers/BaseEditController.js:98-99,119-120`.

2. **`#redirectToGame(gameSlug)`** — byte-identical private method in 3 controllers: `.../game/pages/controllers/GamePollController.js:148-152`, `GamePollsController.js:102-105`, `GameTasksController.js:182-186`. All 3 already extend `BasePageController`.

3. **`buildReadOnlyActionBarProps()`** — identical body (`{ canEdit: false, secondaryButtons: [] }`) defined independently 3 times: `.../common/list_types/listTypeConfig.js:163-165`, `.../configs/characterListTypes.js:68-70`, `.../configs/characterTreasureListTypes.js:125-127`.

4. **"Resolve `can_edit` → pick `all.json` vs. plain endpoint → `fetchIndex` → normalize `{data, pagination, canEdit}`" pattern** — reimplemented 5 times with only path strings differing: `fetchTreasures` (`listTypeConfig.js:30-44`), `fetchGameItems` (`listTypeConfig.js:109-122`), `buildFetchCharacterItems` (`listTypeConfig.js:135-155`), `fetchNpcs` (`configs/characterListTypes.js:45-59`), `fetchNpcTreasuresList` (`configs/characterTreasureListTypes.js:72-85`).

5. **`#renderPager`** — 27-line block, byte-for-byte identical between two unrelated helpers: `.../character/pages/elements/helpers/TreasureExchangeModalHelper.jsx:130-156` and `.../treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx:67-93`.

6. **Dynamic add/remove option-row rendering** — near-identical `#renderTypeField`/`#renderOption`/`#renderDate` blocks: `.../game/pages/helpers/GamePollNewHelper.jsx:92-115,129-154` vs. `.../game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx:67-89,91-116`.

7. **Per-field `useState` + inline `onChange` closures**, repeated across ~9 New/Edit page components — clearest instances: `.../character/pages/shared/CharacterEdit.jsx:21-38` (18 `useState` calls) and `.../character/pages/GameNpcNew.jsx:13-24` (12 fields); same shape echoed in `GameEdit.jsx`, `GameTreasureEdit.jsx`, `TreasureEdit.jsx`, `GameSessionEdit.jsx`, `MyAccount.jsx`, `StaffUserEdit.jsx`, `Register.jsx`.

### 2. Classes/components too big

8. **`CharacterEdit.jsx`** — 18 independent `useState` calls plus 3 modal-visibility flags in one function component, handling form state, load side effects, and submit orchestration inline (`frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx:20-97`).

9. **`GameNpcNew.jsx`** — same shape at smaller scale, 12 `useState` calls (`.../character/pages/GameNpcNew.jsx:13-24`).

### 3. Complex logic embedded in components instead of delegated to a controller

10. **`TreasureExchangeModal.jsx`** — keeps the entire browse/search/debounce/tab/confirm state machine inline (7 `useState`, 2 `useEffect` with a debounce-guard ref) even though `TreasureExchangeModalController` already exists for fetch/parse logic (`.../character/pages/elements/TreasureExchangeModal.jsx:90-204` vs. `.../character/pages/elements/controllers/TreasureExchangeModalController.js`).

11. **`GameSession.jsx#handleSubmit`** — embeds the message-post request (fetch → check `response.ok` → parse errors → clear + reload) directly in the component, alongside two controllers that already own related logic (`.../game_session/pages/GameSession.jsx:56-71`).

### 4. Duplicated JSX blocks inside a single helper

12. **`BaseCharacterEditHelper#renderAllegianceFields`** — renders two nearly identical `<select>` blocks (allegiance / public_allegiance), each hand-repeating the same three `<option>` values (`.../character/pages/helpers/BaseCharacterEditHelper.jsx:150-191`).

No genuine, isolated cases were found for "big component HTML/JSX" beyond what's covered above, or for oversized loop bodies — sampled `.map()`/`.forEach()` bodies already delegate to a named `#renderX` method per iteration.

## Expected Behavior
Purely internal refactor — no user-visible or functional behavior changes. All existing frontend tests continue to pass, extended with new specs where extraction creates new units (helpers/hooks/components) that warrant direct coverage.

## Solution
For each case above, apply the matching extraction:

1. Extract a single `parseJsonOrReject(response, message)` helper (e.g. `frontend/assets/js/utils/http/parseJsonOrReject.js`) and use it at all 14+ call sites.
2. Move `#redirectToGame` up to `BasePageController.redirectTo(hash)`, which all 3 controllers already extend.
3. Replace the 3 independent `buildReadOnlyActionBarProps()` definitions with one shared export.
4. Extract a shared `fetchPermissionGatedIndex(gameSlug, { allPath, plainPath }, filterParams, client)` helper used by all 5 call sites.
5. Extract a shared `BrowsePager` component (prev/next buttons + "page / pages" label) used by both modal helpers.
6. Extract a shared `RemovableOptionRow`/`PollOptionRow` component and a shared `PollTypeRadioGroup` component, used by both poll-creation helpers.
7. Consolidate related per-field `useState` calls into a single `formState` object (or a shared `useFormState(initial)` hook with a generic `handleChange(field)` factory) in each New/Edit page component.
8. & 9. Extract a `useCharacterEditForm(ControllerClass, getParamsFromHash)` hook (or equivalent per-page form-state hook) that owns field state/handlers, shared between `CharacterEdit.jsx` and `GameNpcNew.jsx` where applicable.
10. Move the tab/search/browse state machine out of `TreasureExchangeModal.jsx` into `TreasureExchangeModalController` (or a dedicated `useTreasureExchangeModalState` hook), matching the Controller-owns-orchestration pattern used elsewhere.
11. Move the message-post flow out of `GameSession.jsx#handleSubmit` into `SessionMessagesController` (e.g. a `postMessage(...)` method).
12. Extract a `#renderAllegianceSelect(id, label, value, onChange)` method (or small `AllegianceSelect` component) in `BaseCharacterEditHelper`, called twice instead of duplicating both `<select>` blocks.

## Benefits
- Removes ~19 instances of duplicated logic, so future fixes/changes only need to happen in one place.
- Brings the handful of outlier components in line with the rest of the codebase's existing Controller/Helper delegation convention.
- Shrinks the largest form components (`CharacterEdit.jsx`, `GameNpcNew.jsx`) and clarifies ownership of orchestration logic (`TreasureExchangeModal.jsx`, `GameSession.jsx`), making them easier to extend safely.
