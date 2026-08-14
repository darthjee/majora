# Plan: Make short list components collapsable

Issue: [829-make-short-list-components-collapsable.md](../../issues/829-make-short-list-components-collapsable.md)

## Overview

Make the `ShortList`/`PreviewSection` preview cards (used for pc, npc, treasure, item, document, possession on the Game/PC/NPC show pages) collapsible, so empty sections don't clutter the page. The title becomes clickable, shows the item count from the pagination `total` header (or "loading" while the fetch is in flight), and the section defaults to collapsed while unknown or empty, auto-opening once data resolves to a non-empty list — unless the user has already manually toggled it, in which case their choice wins. Frontend-only change; no backend/API changes needed.

## Context

`ShortList.jsx` currently has a hard `if (loading) return null;` early return, so nothing renders until its fetch resolves, and `PreviewSection`/`PreviewSectionHelper` always render fully expanded with no way to collapse. `ShortListController` fetches via `RequestStore.ensure` and only forwards `{ data }`, discarding the `pagination` metadata (which includes `total`) that `RequestClient` already parses from the response's `total` header. All six resources share the exact same `ShortList` → `PreviewSection` → `PreviewSectionHelper` stack via `buildShortListSlot(resource)`, so a single implementation covers all of them.

## Implementation Steps

### Step 1 — Thread `total` through `ShortListController`

In `frontend/assets/js/components/common/cards/controllers/ShortListController.js`:
- Add a third constructor parameter, `setTotal`, stored alongside `this.setItems`/`this.setLoading`.
- In `buildEffect`, change `.then(({ data }) => this.#handleResponse(data, mounted))` to destructure `{ data, pagination }` and pass both through, calling `this.setTotal(pagination.total)` in `#handleResponse` (guarded by the existing `mounted` check, same as `setItems`).
- In `.catch(() => this.#handleResponse([], mounted))`, also reset the total to `0` — the error path must not leave the title stuck on "loading" forever. The simplest correct shape: `#handleResponse(data, pagination, mounted)` called with `pagination = { total: 0 }` on the catch path, so both `setItems([])` and `setTotal(0)` happen together in one place.

### Step 2 — Wire `total` and remove the loading early-return in `ShortList`

In `frontend/assets/js/components/common/cards/ShortList.jsx`:
- Add `const [total, setTotal] = useState(0);` alongside `items`/`loading`.
- Pass `setTotal` into `new ShortListController(resource, setItems, setLoading, setTotal)`.
- Remove the `if (loading) return null;` block — `PreviewSection` should now always render, even while `loading` is `true`.
- Pass new props into `PreviewSection`: `loading`, `total`, and `defaultCollapsed={!loading && items.length === 0}` (i.e. collapsed by default while loading and once resolved-empty; not collapsed once resolved-non-empty).
- Update the JSDoc `@returns` comment (it currently documents the `null`-while-loading behavior, which no longer applies).

### Step 3 — Own collapse state in `PreviewSection`

In `frontend/assets/js/components/common/cards/PreviewSection.jsx` (currently a plain pass-through function calling `PreviewSectionHelper.render`):
- Convert it to hold state: `const [collapsed, setCollapsed] = useState(defaultCollapsed);` and `const [userInteracted, setUserInteracted] = useState(false);`.
- Add a `useEffect` that syncs `collapsed` to the incoming `defaultCollapsed` prop whenever it changes, but only while `userInteracted` is `false` (dependency: `[defaultCollapsed]`, guarded by reading `userInteracted` inside without adding it as a dependency that would refire the sync — a functional update or a ref-backed guard both work; pick whichever fits the existing codebase's hook style).
- `onToggle` handler: `() => { setUserInteracted(true); setCollapsed((current) => !current); }`.
- Pass `items`, `title`, `seeAllHref`, `icon`, `maxItems`, `renderItem`, `emptyText` (existing props) plus `loading`, `total`, `collapsed`, `onToggle` into `PreviewSectionHelper.render(...)`.

### Step 4 — Loading-aware, collapsible render in `PreviewSectionHelper`

In `frontend/assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx`:
- Build the title text: `` `${title} (${loading ? Translator.t('...loading...') or literal 'loading' : total})` `` — per the issue, this is plain string concatenation, not i18n interpolation (confirm exact wording with existing conventions; issue example is literally `NPCs (loading)`).
- Make the heading clickable (wrap the `<h2>` in a `<button>`/clickable element calling `onToggle`, similar in spirit to `DescriptionBoxHelper`'s toggle button — see `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` for the existing icon-button/`OverlayTrigger` pattern used elsewhere in this codebase, e.g. `Icons.caretUpSquareFill`/`Icons.caretDownSquareFill` or `Icons.arrowsExpand`/`Icons.arrowsCollapse` from `frontend/assets/js/utils/ui/Icons.js`). Add `aria-expanded={!collapsed}` on the toggle control — there's no existing `aria-expanded` convention in this codebase to follow, so this is new, standard practice.
- Only render the body (`#renderEmptyText`, the `.row` of items, `SeeAllCard`) when `!collapsed`. The title/toggle row itself always renders, even while `loading`.

### Step 5 — Update existing specs

- `frontend/specs/assets/js/components/common/cards/ShortListSpec.js` — currently asserts an empty-string render while loading; rewrite to assert the title renders immediately (with "loading" text) instead of `null`/`''`.
- `frontend/specs/assets/js/components/common/cards/PreviewSectionSpec.js` — update to account for the new `collapsed`/`onToggle`/`loading`/`total` state and props; add cases for toggling and for `defaultCollapsed` syncing (and not syncing after user interaction).
- `frontend/specs/assets/js/components/common/cards/helpers/PreviewSectionHelperSpec.js` — update the fixed positional-arg call signature for the new params; add cases for collapsed-hides-body, loading-shows-title-only, and the toggle control's `aria-expanded`.
- `frontend/specs/assets/js/components/common/cards/controllers/ShortListControllerSpec.js` — update the 2-arg `new ShortListController(resource, setItems, setLoading)` calls to include the new `setTotal` setter; add assertions that `setTotal` receives `pagination.total` on success and `0` on fetch failure.

### Step 6 — Manual verification

Run the app locally and check each of the example pages/lists called out in the issue (`/#/games/:game_slug`, `/#/games/:game_slug/pcs/:id` — PCs/NPCs on Game show, treasures/items/documents/possessions on PC/NPC show) for: loading state showing "(loading)", correct default collapse/open based on emptiness, working toggle (including toggling before data has loaded and confirming the resolved default doesn't override it), and the title count matching pagination totals.

## Files to Change

- `frontend/assets/js/components/common/cards/controllers/ShortListController.js` — add `setTotal`, thread `pagination.total` through success and error paths.
- `frontend/assets/js/components/common/cards/ShortList.jsx` — add `total` state, remove loading early-return, compute and pass `defaultCollapsed`/`loading`/`total`.
- `frontend/assets/js/components/common/cards/PreviewSection.jsx` — own `collapsed`/`userInteracted` state, sync-on-`defaultCollapsed`-change effect, `onToggle` handler.
- `frontend/assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx` — clickable title with count/"loading" text and `aria-expanded` toggle, conditional body render.
- `frontend/specs/assets/js/components/common/cards/ShortListSpec.js` — update for the new always-rendered-title behavior.
- `frontend/specs/assets/js/components/common/cards/PreviewSectionSpec.js` — update for new state/props.
- `frontend/specs/assets/js/components/common/cards/helpers/PreviewSectionHelperSpec.js` — update for new render signature and collapsed/loading render paths.
- `frontend/specs/assets/js/components/common/cards/controllers/ShortListControllerSpec.js` — update constructor calls and add `setTotal` assertions.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — only relevant if any new translation keys are introduced; per the issue's decision (plain string concatenation, no i18n interpolation), this should be a no-op, but the job still runs against `frontend/`.
- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs the full Jasmine spec suite including the four spec files listed above.

## Notes

- The issue explicitly decided against a shared `Collapsible` wrapper component (would require also refactoring `DescriptionBox`, out of scope) and against a per-resource opt-in/opt-out config knob — collapse is unconditional for all 6 resources.
- No persistence of collapse state across navigation/reload — this is intentional, not a gap; the whole page subtree remounts on every navigation anyway.
- The exact toggle icon (`Icons.arrowsExpand`/`arrowsCollapse` vs. `Icons.caretUpSquareFill`/`caretDownSquareFill`) is left as an implementation choice — pick whichever reads best for a section-level (not text-truncation) toggle.
