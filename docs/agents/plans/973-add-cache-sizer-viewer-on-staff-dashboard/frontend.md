# Frontend Plan: Add cache sizer viewer on staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `GET /staff/cache/size.json` (produced by `proxy.md`): `200` → `{"size": <bytes>}`;
any failure (`403`, network error, or a propagated non-`200`) → treated identically, no need to
branch on the exact status. Consumes the `staff_dashboard.disk_cache_title` and
`staff_dashboard.disk_cache_load_error` translation keys (produced by `translator.md`), plus the
existing `staff_dashboard.loading` key.

## Implementation Steps

### Step 1 — Client method

Add a `fetchDiskCacheSize(token)` method to the existing
`frontend/assets/js/client/StaffCacheClient.js` (same client already used for the memory-cache
card — this is still "staff cache," just a different cache):

```js
fetchDiskCacheSize(token) {
  return this.getJson('/staff/cache/size.json', token);
}
```

### Step 2 — Size-only display component

`MetricDisplay` (`.../pages/elements/MetricDisplay.jsx`) requires both `value` and `limit` to
render its percentage bar, which doesn't fit a size with no limit. Add a small new component,
e.g. `.../pages/elements/SizeDisplay.jsx`, that reuses the same conversion/formatting logic
(`UnitConverters.forType(valueType).convert()` + `UnitConverters.formatValue()`) but renders just
the converted value + unit text (e.g. "128 MB"), no percentage/bar:

```jsx
export default function SizeDisplay({ value, valueType }) {
  const converter = UnitConverters.forType(valueType);
  const converted = converter.convert(value);
  return <span>{`${UnitConverters.formatValue(converted.value)} ${converted.unit}`}</span>;
}
```

### Step 3 — `DiskCacheCard` (component + controller + helper)

Mirror `MemoryCacheCard`'s three-file split (`MemoryCacheCard.jsx` /
`controllers/MemoryCacheCardController.js` / `helpers/MemoryCacheCardHelper.jsx`), but simpler
since there are no actions and no `limit`:

- `DiskCacheCardController.js` — constructor takes `(setSize, setLoading, setError, client =
  null)`. `buildEffect()` fetches once on mount (same `mounted`/safe-setter guard pattern as
  `MemoryCacheCardController`). On any failure (`!response.ok` or a thrown fetch error), set
  `error = true` and schedule a retry via `setTimeout(..., 60000)` that re-runs the same fetch;
  clear the timer in the effect's cleanup function so it doesn't leak across unmounts. On
  success, set the fetched `size` and clear the error flag.
- `DiskCacheCardHelper.jsx` — renders via `DashboardCard`/`CardTop`, no `CardActions` (pass
  `actions={null}`, matching "no action button for now"). `CardTop`'s `data` slot: `Translator.t('staff_dashboard.loading')`
  text while loading (same key `MemoryCacheCard` reuses for its own loading state), a
  `<SizeDisplay value={size} valueType="bytes" />` on success, or
  `Translator.t('staff_dashboard.disk_cache_load_error')` (`text-danger`) on error. Title:
  `Translator.t('staff_dashboard.disk_cache_title')`.
- `DiskCacheCard.jsx` — thin wrapper following `MemoryCacheCard.jsx`'s exact shape (hooks state,
  builds the controller via `useMemo`, runs the effect, delegates rendering to the helper).

### Step 4 — Register the card

Add to `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`:

```js
{ key: 'disk_cache', Component: DiskCacheCard },
```

placed after the existing `memory_cache` entry.

### Step 5 — Tests

Mirror the existing `MemoryCacheCard*Spec.js` files' structure and location
(`frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/`,
`.../controllers/`, `.../helpers/`), covering:

- Controller: successful fetch sets size; `!response.ok` and thrown-error cases both set `error`
  and schedule a retry; the retry timer is cleared on unmount (use Jasmine's clock mocking, same
  as any other timer-based spec in this codebase).
- Helper: loading/success/error render branches, and that no `CardActions`/action buttons render.
- `SizeDisplay`: a couple of byte-value conversions (reuse `BytesUnitConverter`'s existing
  threshold cases from `MetricDisplay`'s specs as reference, no need to re-derive them).

## Files to Change

- `frontend/assets/js/client/StaffCacheClient.js` — add `fetchDiskCacheSize`.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/SizeDisplay.jsx` — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/DiskCacheCard.jsx` —
  new.
- `.../elements/controllers/DiskCacheCardController.js` — new.
- `.../elements/helpers/DiskCacheCardHelper.jsx` — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js` —
  register the new card.
- Matching new spec files under `frontend/specs/...` (see Step 5).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- Depends on `translator.md`'s two new keys existing before `yarn check_i18n` passes — implement
  after (or alongside) the translator's changes.
- No `limit`/percentage-bar UI for this card, unlike `MemoryCacheCard` — confirmed in the issue,
  don't reach for `MetricDisplay` with a fake 100% limit.
