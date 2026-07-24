# Issue: Improve memory cache staff component

## Description
In the staff dashboard (`/#/staff/dashboard`), the `MemoryCacheCard` component (`frontend/assets/js/components/resources/staff_dashboard/pages/elements/MemoryCacheCard.jsx`) displays memory cache usage using a `PercentageDisplay` component (`frontend/assets/js/components/resources/staff_dashboard/pages/elements/PercentageDisplay.jsx`), which currently renders only the color-coded percentage (`value / limit`).

`PercentageDisplay` is only consumed by `MemoryCacheCard` today (via `MemoryCacheCardHelper.jsx`), so this change is scoped to that single component tree.

`PercentageDisplay` is renamed to `MetricDisplay` as part of this change.

## Problem
Even though the percentage is shown, the actual raw value and limit are not, so staff cannot tell the real numbers behind the percentage to judge whether action (e.g. clearing cache, raising limits) is warranted.

## Expected Behavior
Below the existing percentage, the component shows the converted value and limit with their unit, e.g.:

```
<percentage>  %
<converted value> <units> / <converted limit> <units>
```

Both numbers are displayed with up to 1 decimal place, with trailing zeros trimmed (e.g. `2 MB`, not `2.0 MB`; `2.5 MB` stays as-is).

## Solution
- Rename `PercentageDisplay` to `MetricDisplay` (it now does more than display a percentage) and add the value/limit line described above.
- Add a `valueType` prop to `MetricDisplay` — a single value type applies to the whole component (both value and limit).
- Introduce one specialized unit-conversion class per value type, responsible for picking the right unit for a raw number and converting it.
- Introduce a small factory/registry keyed by `valueType` (e.g. `{ bytes: BytesUnitConverter }`) that resolves the right conversion class, so adding a future value type is a one-line registration rather than a rewrite.

### Value types
For now, only `bytes` exists as a value type. `MemoryCacheCard` passes `valueType="bytes"`.

### Bytes unit conversion
Units, from smallest to largest:
- `B` (bytes) — base unit, worth 1 `B`
- `KB` (kilobytes) — 1024 `B`
- `MB` (megabytes) — 1024 `KB`
- `GB` (gigabytes) — 1024 `MB`

A value switches to the next unit once it reaches roughly 90% of the current unit's size (i.e. 1024 * 0.9 = 921, truncated). Concretely, for a raw byte value `n`:
- `0 <= n < 921` → unit `B`, converted value `n`
- `921 <= n < 943104` (`921 * 1024`) → unit `KB`, converted value `n / 1024.0`
- `943104 <= n < 965738496` (`943104 * 1024`) → unit `MB`, converted value `n / 1048576.0`
- `n >= 965738496` → unit `GB`, converted value `n / 1073741824.0`

Value and limit are each converted independently using this scale (so, e.g., a small value could show in `KB` while a much larger limit shows in `GB`).

## Benefits
Staff can see the real usage/limit numbers behind the percentage, making it easier to judge when and how to act on memory cache (clearing it, adjusting limits, etc.).
