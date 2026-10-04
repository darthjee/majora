# Issue: Access statistics: Recharts setup (lazy chunk, sizing, test setup, colors)

## Description
Charting groundwork for the staff access statistics page (#1477). The authoritative conventions are in the "Recharts conventions" section of `docs/agents/specs/access-statistics/shared-infrastructure.md` (specced in #1482). Read them there instead of a copy here. This builds on the frontend shell from #1499 (merged): the `staff_statistics` folder, the tab pages and the shell already exist.

## Problem
The app has no charting library, no `React.lazy` code splitting and no CSS custom properties. Every chart tab (#1507 Visits, #1510 Visitors, #1514 Duration, #1517 Domains) needs the same base: the Recharts dependency, a lazy chunk that non-staff users never download, a sizing convention, a way to test charts under Jasmine in Node, and a shared color palette. Without one setup issue, each tab would solve these on its own and differently.

## Expected Behavior
- `recharts` 3.x is in `frontend/package.json` and the lockfile.
- All statistics charts load from one lazy chunk (`components/resources/staff_statistics/charts/index.js`), and Vite emits it as a separate chunk that non-staff pages don't load.
- Charts render inside `<div data-testid="statistics-<name>-chart">` wrapping `<ResponsiveContainer width="100%" height={300}>`.
- Chart smoke tests run under Jasmine (Node, `renderToStaticMarkup`).
- Chart colors come from `--majora-chart-*` CSS variables.

## Solution
- **Dependency:** `docker-compose run --rm majora_fe yarn add recharts` (3.x; React 19.2 is supported).
- **Lazy chunk:** create `charts/index.js` re-exporting every chart. Add one shared lazy wrapper element, e.g. `pages/elements/StaffStatisticsCharts.jsx`. It owns the single `React.lazy(() => import('../../charts/index.js'))` and the `<Suspense fallback={<LoadingMessage />}>` (`components/common/misc/LoadingMessage.jsx`), and renders a chosen chart from the chunk by name with the given props. Tab pages use this wrapper instead of writing their own `React.lazy`. Pages, the shell, the filter bar and controllers stay in the main bundle.
- **Proving the split:** mount the reference chart through the wrapper on one tab placeholder (the Visitors tab, a line-chart tab; #1510 later replaces it with real data). That puts the dynamic import in the bundle graph. Confirm in the Vite build output that the charts chunk is separate and isn't loaded by non-staff pages.
- **Test setup:** smoke tests import chart components directly, not through the lazy chunk. If Recharts reads `ResizeObserver` under Node at import or render time, add `frontend/specs/support/resizeObserverStub.js`. It is a guarded no-op that only defines `globalThis.ResizeObserver` when missing, registered as a Jasmine helper like `preloadTranslations.js`, and documented in the spec page.
- **Colors:** add a `:root` block to `assets/css/main.scss` declaring `--majora-chart-1` … `--majora-chart-6` (starting from `$secondary-color` and `$primary-color`), plus `--majora-chart-grid` and `--majora-chart-axis`. Use them as `stroke="var(--majora-chart-1)"` / `fill=...`.
- **Reference chart:** a reusable, generic `charts/TimeSeriesChart.jsx` plus `charts/helpers/TimeSeriesChartHelper.jsx` with a pure `render(points, …)`. It takes an X-axis key and a configurable list of line series (`dataKey`, color variable, label), so tabs such as Visitors and Duration can reuse it directly. It follows the spec's composition order (`CartesianGrid` → axes → `Tooltip` → series), `isAnimationActive={false}`, and colors from the CSS variables. Smoke tests cover empty, single-point and normal data, mirrored under `frontend/specs/assets/js/components/resources/staff_statistics/charts/`. It gives the tab issues a template.
- **Owner:** `frontend` agent.

### Acceptance criteria
- [ ] `recharts` is in `package.json` and the lockfile, and the charts are in a lazy chunk that non-staff pages don't load.
- [ ] A shared lazy wrapper is the only `React.lazy` entry to the charts chunk, and it is mounted on one tab so the Vite build emits the chunk.
- [ ] The generic reference chart and its smoke tests pass in CI, and any `ResizeObserver` stub is documented in the spec page.
- [ ] Chart colors use the CSS variables.

## Benefits
The tab issues get one tested template for dependency, chunking, sizing, testing and colors. Recharts stays out of the main bundle for regular users.
