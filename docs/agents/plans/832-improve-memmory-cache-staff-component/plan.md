# Plan: Improve memory cache staff component

Issue: [832-improve-memmory-cache-staff-component.md](../../issues/832-improve-memmory-cache-staff-component.md)

## Overview
`PercentageDisplay` (used only by `MemoryCacheCard`) currently shows just a color-coded percentage. This plan renames it to `MetricDisplay`, adds a `valueType` prop, and renders a second line below the percentage with the converted value and limit plus their unit (e.g. `2.3 MB / 4 GB`), trimmed to at most 1 decimal. Unit selection/conversion is delegated to a per-`valueType` converter class resolved through a small factory, with `bytes` as the only type for now.

## Context
- `MemoryCacheCard.jsx` → `MemoryCacheCardHelper.jsx` renders `<PercentageDisplay value={summary.size} limit={summary.limit} thresholds={undefined} />`.
- `PercentageDisplay.jsx` computes `percentage = value / limit`, resolves a color level via `PercentageThresholds.levelFor`, and renders `{Math.round(percentage * 100)}%`.
- `PercentageDisplay` has no other consumers in the codebase — this refactor is fully contained to this component and its direct callers.
- Bytes unit boundaries (raw byte value `n`): `B` for `n < 921`, `KB` for `n < 943104` (`n / 1024.0`), `MB` for `n < 965738496` (`n / 1048576.0`), `GB` above that (`n / 1073741824.0`). Value and limit are converted independently — they may end up in different units.
- Decimal formatting: up to 1 decimal, trailing zero trimmed (`2 MB`, not `2.0 MB`; `2.5 MB` unchanged).

## Implementation Steps

### Step 1 — Add the bytes unit converter
Create `frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js`, a class (or module) exposing a method like `convert(rawValue)` that returns `{ value, unit }` using the thresholds above. Keep the formatting (decimal trim) as a separate concern (see Step 2) so the converter only deals with unit selection and numeric conversion.

### Step 2 — Add a value-type factory and shared number formatting
Create `frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/UnitConverters.js` (or similar name) exporting a registry keyed by `valueType`, e.g. `{ bytes: BytesUnitConverter }`, plus a lookup function (e.g. `UnitConverters.forType(valueType)`) that throws or returns `undefined` for an unregistered type. Put the "up to 1 decimal, trim trailing zero" number formatting here too (or as a small shared helper) so both the converter output and any future value type format consistently.

### Step 3 — Rename `PercentageDisplay` to `MetricDisplay`
- Rename `PercentageDisplay.jsx` to `MetricDisplay.jsx` in the same `elements/` folder.
- Add a required `valueType` prop.
- Keep the existing percentage/color logic unchanged (still uses `PercentageThresholds`).
- Below the percentage `<span>`, render a second line built from `UnitConverters.forType(valueType)` applied to `value` and to `limit` independently, formatted per Step 2, in the `<converted value> <unit> / <converted limit> <unit>` shape from the issue.

### Step 4 — Update consumers and stale references
- `MemoryCacheCardHelper.jsx`: import `MetricDisplay` instead of `PercentageDisplay`, add `valueType="bytes"` to the existing usage.
- `CardTop.jsx`: update the JSDoc example mentioning `PercentageDisplay` to `MetricDisplay`.
- `PercentageThresholds.js`: update the JSDoc reference to `PercentageDisplay` to `MetricDisplay` (this class itself is not renamed — it's still about percentage color thresholds).

### Step 5 — Tests
- Rename `frontend/specs/.../elements/PercentageDisplaySpec.js` to `MetricDisplaySpec.js`, update the import/component name, pass `valueType="bytes"` in every case, and extend assertions to cover the new value/limit line (including a case per unit boundary: just under/over 921, 943104, 965738496) and decimal trimming (whole number vs. `.5` case).
- Add specs for `BytesUnitConverter` (unit selection at and around each boundary, conversion math) and for the `UnitConverters` registry/factory (resolves `bytes`, and the not-found behavior for an unknown `valueType`).
- Update `MemoryCacheCardHelperSpec.js` assertions that render `MetricDisplay` output (e.g. the `size: 30, limit: 100` case) to also assert the new `30 B / 100 B` line, since these are small byte values under the first threshold.

## Files to Change
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js` — new, unit selection + conversion for `bytes`.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/UnitConverters.js` — new, `valueType` → converter registry + number formatting helper.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/PercentageDisplay.jsx` → renamed to `MetricDisplay.jsx` — add `valueType` prop and value/limit line.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/MemoryCacheCardHelper.jsx` — use `MetricDisplay`, pass `valueType="bytes"`.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/CardTop.jsx` — JSDoc reference update only.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/PercentageThresholds.js` — JSDoc reference update only.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/PercentageDisplaySpec.js` → renamed to `MetricDisplaySpec.js` — updated/extended.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverterSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/units/UnitConvertersSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/helpers/MemoryCacheCardHelperSpec.js` — updated assertions.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No i18n changes expected — units (`B`/`KB`/`MB`/`GB`) are technical, not translated strings; no backend/API changes are needed since `summary.size`/`summary.limit` are already available as raw numbers.
- `valueType` is a single value for the whole component (applies to both `value` and `limit`), per the issue.
