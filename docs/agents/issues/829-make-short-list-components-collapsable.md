# Issue: Make short list components collapsable

## Description
Several pages in the app render "short list" preview sections for related resources — e.g. the Game show page previews its PCs and NPCs, and PC/NPC show pages preview treasures, items, documents, and possessions. All of these share the same component stack: `ShortList` (fetches data per resource) → `PreviewSection` (stateful wrapper) → `PreviewSectionHelper` (renders title, item rows, and a "See all" card), driven by `shortListResourceConfig.js` for the 6 resource types (pc, npc, treasure, item, document, possession).

## Problem
These preview sections always render fully expanded, including their heading and "See all" card, even when the underlying list is empty. On pages like `/#/games/:game_slug/pcs/:id`, several of these sections are frequently empty at once, which clutters the page with headers and empty-state text for content that doesn't exist.

## Expected Behavior
- Each short list section becomes collapsible/expandable, toggled by clicking its title.
- The section starts collapsed by default; once its data has loaded, it stays collapsed if the list is empty, or opens automatically if the list is not empty.
- The title displays the total element count from the pagination header, e.g. `NPCs (100)`.
- While the section is still loading, the title renders immediately (e.g. `NPCs (loading)`), rather than the section being blank/absent — this is a deliberate change from today's behavior, where nothing renders until the fetch resolves.
- The section is interactive (toggleable) even while still loading. Once a user manually toggles a section, that choice is respected — the section's own load completion does not override it (e.g. opening a section before its data arrives, then having it resolve to empty, does not force it back closed).
- Collapse state does not persist across page navigation or reload; it always resets to the data-driven default on every fresh mount.
- This behavior applies uniformly to all 6 resource types (pc, npc, treasure, item, document, possession) with no per-resource opt-in/opt-out.

## Solution
**Where the collapse logic lives**: the codebase already splits each `*Section`-style component into a stateful "smart" component (owns `useState`, e.g. `PreviewSection`, `DescriptionBox`) and a stateless, prop-only `*Helper` renderer (`PreviewSectionHelper`, `DescriptionBoxHelper`). Following that pattern, the collapsed/expanded boolean state should live in `PreviewSection` (not `PreviewSectionHelper`, and not `ShortList`).
- `ShortList` (the data-fetching component) computes the collapsed default — `items.length === 0` while unknown/loading, then the real value once loaded — and passes it into `PreviewSection` as `defaultCollapsed`. Since `PreviewSection` now mounts before loading finishes, `defaultCollapsed` is a prop that can change after mount, not just a one-time initial value.
- `PreviewSection` owns the toggle state itself (`collapsed`) plus a `userInteracted` flag, and passes `{ collapsed, onToggle }`-style props down to `PreviewSectionHelper` for rendering (title + toggle affordance, and conditionally the list body). A `useEffect` syncs `collapsed` to `defaultCollapsed` whenever the latter changes, but only while `userInteracted` is `false`; the first manual toggle sets `userInteracted = true`, after which further `defaultCollapsed` changes (e.g. the fetch resolving) are ignored and whatever state the user left it in is kept.
- `DescriptionBox`'s expand/collapse pattern is not a fit to reuse directly: it solves text truncation (measuring `scrollHeight` against a max-height via `useLayoutEffect`) to show/hide part of a block, whereas this issue needs a simple whole-section show/hide (only the title stays visible when collapsed, the entire list body — including empty-state text and "See all" card — hides). A generic shared `Collapsible` wrapper was considered and rejected as out of scope: it would require refactoring `DescriptionBox` too, which this issue doesn't ask for.
- No existing `collapsed`/`Collapsible`/`Accordion` component or prop exists elsewhere in the codebase for this purpose, so there's no naming collision to avoid.

**How the total count gets threaded through**: confirmed — all 6 `ShortList` resource endpoints (pc, npc, treasure, item, document, possession) are backed by paginated Django views that share the `paginated_list_response`/`Paginator` mechanism, which always sets a `total` header reflecting the full collection size (not just the fetched preview page). The frontend already parses this into `pagination.total` via `RequestClient`, but `ShortListController` currently discards it. No backend changes are needed — this is frontend-only wiring:
- `ShortListController` needs to capture `pagination.total` (currently only `{ data }` is destructured and forwarded) and expose it via a new setter, alongside the existing `setItems`/`setLoading`.
- `ShortList` needs a `total` state value wired to that setter.
- The title is built via plain string concatenation (no i18n interpolation), e.g. `` `${Translator.t(config.titleKey)} (${total})` ``.

**Collapse-state persistence**: no persistence — a manual toggle does NOT survive page reload or navigation; collapse state always resets to the data-driven default (collapsed if empty, open if non-empty) on every mount. There's no existing mechanism to build on: the frontend has no generic UI-preference storage (only `LanguageStorage.js`, a one-off `localStorage` wrapper for language), the backend `UserProfile` has no generic preferences field, and the whole page subtree already fully remounts on every navigation/reload (`AppHelper.jsx` keys the page fragment on the full route hash), so local component state is naturally lost anyway. Adding persistence would be new infrastructure out of scope for this issue.

**Loading-state behavior**: today `ShortList` has a hard early return (`if (loading) return null;`) — nothing renders while fetching, matching every other preview-slot widget in the app (e.g. `CharacterDocumentFilesPreview.jsx`). This issue changes that: the title renders immediately (before the fetch resolves), with the count area showing the literal text `NPCs (loading)` (same pattern for all resources) in place of a number.
- The section is interactive (toggleable) even while loading — a user opening it before data arrives is fine, per the `userInteracted` flag above: if the fetch later resolves to an empty list, the section does NOT force itself closed on top of a user who already opened it.
- This requires `PreviewSection`/`PreviewSectionHelper` to gain a loading-aware render path (title + toggle always visible; list body/empty-text/"See all" card only once loaded) that doesn't exist today — a deliberate deviation from the existing "return null while loading" convention used elsewhere, chosen here because it gives the page visible structure immediately instead of everything appearing at once when each fetch happens to resolve.

**Edge cases**:
- *Fetch errors*: `ShortListController` already degrades a failed fetch to `items: []` (same as a legitimately-empty list) and always clears `loading`. The new `setTotal` setter must also be reset to `0` on the error/catch path, not just on success — otherwise the title would get stuck showing `NPCs (loading)` forever even after the (empty) body renders.
- *Race conditions*: none introduced by rendering `PreviewSection` immediately instead of returning `null` while loading. The existing `mounted`-flag guard (already protecting `setItems`/`setLoading` against late responses after unmount) extends trivially to the new `setTotal` call, and `PreviewSection`'s `userInteracted`/`defaultCollapsed` sync only reacts to its own parent's render, independent of fetch timing.
- *`total` vs `items.length` divergence*: not possible — `ShortList` only ever fetches page 1, and the backend `Paginator` computes `total` from the same already-filtered queryset within the same request/response cycle (permission filtering happens upstream of pagination). `defaultCollapsed = items.length === 0` and `total === 0` will always agree; no special-casing needed.
- *Accessibility*: no existing `aria-expanded` convention anywhere in the frontend (confirmed zero usages) — this is new ground. The new toggle control should set `aria-expanded={!collapsed}` as standard, low-cost practice, even though nothing in the codebase forces it.
- *Multiple instances*: no risk — each of the 6 resources appears at most once per page config (Game/PC/NPC show pages), each with its own `ShortListController` instance and local state; no shared-state or config-mutation concerns.

**Scope — applies uniformly, no opt-in/opt-out**: collapse is a built-in, unconditional behavior of `PreviewSection` — no new per-resource config knob. `PreviewSection` has exactly one caller (`ShortList`) and no other feature depends on it, so this only affects the 6 known resources (pc, npc, treasure, item, document, possession). No existing opt-out pattern exists in `shortListResourceConfig.js` (its knobs only vary content/fetch/link details, never generic rendering behavior), and nothing about any of the 6 resources' domain model argues for different behavior — all are plain paginated collections with no singleton/always-non-empty constraint.

**Backward compatibility**: three existing Jasmine spec files depend on behavior this issue intentionally changes and will need rewriting as part of the implementation:
- `ShortListSpec.js` — asserts an empty-string render while loading, premised entirely on the `if (loading) return null;` early return this issue removes.
- `PreviewSectionSpec.js` / `PreviewSectionHelperSpec.js` — call with a fixed positional-arg signature and assert the list body/"See all" card is always present; both the signature (new `defaultCollapsed`/`total`/loading params) and the always-visible assumption break once collapse is added.
- `ShortListControllerSpec.js` — constructor currently takes `(resource, setItems, setLoading)`; needs a third `setTotal` setter threaded through, including the existing fetch-failure test (which should additionally assert `setTotal` resets to `0`).
- No other risks found: no other component/spec reads the rendered title string, no CSS assumes the always-present body structure, and both locales' (`en`, `pt`) title strings are short plain nouns with no phrasing conflict for a trailing `(total)`/`(loading)` suffix.

**Alternative solutions considered**: "hide the whole section entirely when empty" (title included) instead of collapsing it. Rejected in favor of the chosen collapse-with-title approach because:
- The preview section is purely read-only navigation — no create/add affordance lives in the section itself. The affordance lives on the "See all" destination page (e.g. `GameItems.jsx` gates a "Create Item" link behind the `can_create_item` permission). Hiding the section entirely when empty would also hide the only discovery path to that destination, and thus to creating the first item.
- The established codebase convention for empty preview sections is "always render, with a muted empty-state message" — never hide outright (confirmed in `CharacterDocumentFilesPreviewHelper.jsx`, `CharacterPhotosPreviewHelper.jsx`). Collapsing (keeping title + "See all" link, hiding just the body) stays consistent with that convention while still solving the visual-clutter problem; hiding entirely would be a new, inconsistent pattern.

**Performance & security**: reviewed, no concerns found.
- *Performance*: negligible. At most 6 `ShortList` instances per page, each independently effect-driven with no shared re-render trigger between instances. Removing the `if (loading) return null;` early return replaces one all-or-nothing render with 2-3 small text-node transitions (title-only-loading → title+data); `PreviewSectionHelper.render` is a cheap pure function over at most `maxItems` items, with no memoization needed.
- *Security*: the new `total` count is computed from the exact same permission-filtered queryset already used for `items` (via the shared `Paginator`), so surfacing it introduces no new information beyond what the user could already see/infer from the visible `items`. The title string is built entirely from fixed i18n keys (`Translator.t(config.titleKey)`) plus a plain numeric total — no free-text/user-controlled interpolation, no `dangerouslySetInnerHTML` anywhere in this component tree (React auto-escapes JSX text). The new collapse/toggle state is a local boolean driven only by a button click — no external input, no injection surface.

**Page examples (not limited to)**:
- `/#/games/:game_slug`
- `/#/games/:game_slug/pcs/:id`

**List examples (not limited to)**:
- PCs list in Game show page
- NPCs list in Game show page
- Item list in PC show page

## Benefits
- Reduces visual clutter on pages with many resource types by collapsing empty sections by default.
- Preserves discoverability: the title and "See all" link stay visible even when a list is empty, so users can still navigate to create the first item.
- Gives users at-a-glance counts (e.g. `NPCs (100)`) without needing to expand each section.
- Frontend-only change — no backend/API modifications required.
