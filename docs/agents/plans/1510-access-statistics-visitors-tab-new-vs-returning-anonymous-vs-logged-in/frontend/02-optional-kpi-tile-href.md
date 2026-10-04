# Make the KPI tile link optional

`pages/elements/StatisticsKpiTile.jsx` always renders the title as a `stretched-link` anchor. Make `href` optional: when absent, render the title text directly inside the `h3` (no anchor, no stretched link); when present, behavior is unchanged (Overview tiles keep linking). Update the JSDoc (`@param {string} [props.href]`) and add a spec case for the no-`href` rendering.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StatisticsKpiTile.jsx` — optional `href`.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StatisticsKpiTileSpec.js` — no-`href` case.
