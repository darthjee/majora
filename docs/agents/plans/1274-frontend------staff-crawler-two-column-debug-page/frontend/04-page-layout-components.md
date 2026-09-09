# Page layout: two-column components

Build the page itself plus its two column elements. Follows
`StaffDashboard.jsx`'s `useState`/`useMemo`/`useEffect(controller.buildEffect())`
shape for the outer page, and `DocumentPagesBox.jsx`'s pattern of keeping
scroll/DOM refs in the component while delegating fetch logic to the
controller (step 03).

## Files to Change

- `frontend/assets/js/components/resources/crawler/pages/StaffCrawler.jsx` —
  new page component.
  - State: `loading`, `error` (gate state, as `StaffDashboard.jsx`),
    `emissions` (array), `selectedId`.
  - `useRef` for the left column's scrollable container (`feedRef`) and a
    boolean ref/state tracking whether the view is currently scrolled to the
    bottom (`isAtBottomRef`), updated by a `onScroll` handler comparing
    `scrollTop + clientHeight` against `scrollHeight` (small tolerance, e.g.
    a few px, for sub-pixel rounding).
  - `useEffect(controller.buildEffect())` for the access gate + feed start,
    same wiring as `StaffDashboard`.
  - A second `useEffect` keyed on `emissions.length`: when it grows and
    `isAtBottomRef.current` is true, set `feedRef.current.scrollTop =
    feedRef.current.scrollHeight` (auto-scroll to bottom); when
    `isAtBottomRef.current` is false, do nothing — this is the "pause while
    scrolled up" behavior from the discuss-issue dialogue.
  - Delegates all rendering to `StaffCrawlerHelper` (loading/error states,
    and the two-column layout), passing `emissions`, `selectedId`,
    `controller.selectEmission`, `feedRef`, and the `onScroll` handler.
- `frontend/assets/js/components/resources/crawler/pages/helpers/StaffCrawlerHelper.jsx`
  — new class, mirrors `StaffDashboardHelper`'s static-method shape
  (`renderLoading`, `renderError`, `render`).
  - `render(...)` — two Bootstrap columns (`row` / `col-*`): left column
    renders the scrollable feed (the `feedRef`'d container + `onScroll`
    handler), one row per emission (id, `created_at` timestamp, `source` and
    `type` as small badges — reuse `Badge`/`TooltipBadge` from
    `common/badges/` if their prop shape fits; otherwise plain `<span
    className="badge ...">`), each row clickable to call
    `selectEmission(id)` and visually highlighted when
    `id === selectedId`. Right column renders
    `<pre>{JSON.stringify(selected, null, 2)}</pre>` for the emission whose
    `id === selectedId` (or a placeholder message when nothing is selected
    yet).
  - `renderLoading`/`renderError` — same `LoadingMessage`/`ErrorAlert` reuse
    as `StaffDashboardHelper`.

## Notes

- No new shared component needed for the JSON pane — the issue explicitly
  rules out pulling in a JSON-viewer dependency; `<pre>` + `JSON.stringify`
  is the deliberate baseline.
- Keep this resource's `elements/` subfolder unused unless the helper method
  grows unwieldy — a single `StaffCrawlerHelper.render` is likely enough
  given the deliberately minimal UI (no filters, no per-row actions).
