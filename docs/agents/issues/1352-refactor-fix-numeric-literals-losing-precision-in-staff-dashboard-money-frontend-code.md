# Issue: Refactor: fix numeric literals losing precision in staff_dashboard/money frontend code

## Description
Codacy's PMD scan (`InnaccurateNumericLiteral`, ErrorProne, High severity) flags 13 numeric literals in the frontend byte/money conversion code and its specs (`965738495`, `965738496`, `1073741824.0`, `100000000`, `10000002`), claiming they lose precision at runtime.

## Problem
Verified in Node: every flagged literal is exactly representable in JS (all are safe integers, and `1073741824.0` is exactly `1073741824`), so the written value already equals the runtime value. The findings appear to be false positives — PMD's `InnaccurateNumericLiteral` is an ECMAScript-oriented rule that misfires on these forms — rather than real precision loss.

Affected locations:
- frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js:4 (965738496)
- frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js:7 (1073741824.0)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverterSpec.js:12 (965738495)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverterSpec.js:13 (1073741824.0)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverterSpec.js:14 (1073741824.0)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/MetricDisplaySpec.js:56 (965738495)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/MetricDisplaySpec.js:57 (965738496)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/SizeDisplaySpec.js:11 (965738495)
- frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/SizeDisplaySpec.js:12 (965738496)
- frontend/specs/assets/js/components/common/misc/TreasureMoneySpec.js:32 (100000000)
- frontend/specs/assets/js/components/common/misc/helpers/TreasureMoneyHelperSpec.js:26 (100000000)
- frontend/specs/assets/js/components/common/misc/helpers/TreasureMoneyHelperSpec.js:52 (10000002)
- frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js:75 (100000000)

## Expected Behavior
- Codacy reports 0 `InnaccurateNumericLiteral` findings for these files
- Runtime behavior is unchanged: the affected specs and the component under test still pass (`yarn test`)

## Solution
Since the literals are already exact, the goal is only to clear the false-positive Codacy findings without changing behavior:

- **Source (`BytesUnitConverter.js`)**: rewrite the flagged thresholds/divisors as derived expressions that make the intent clearer, e.g. `921 * 1024 ** 2` for the MB→GB threshold and `1024 ** 3` for the GB divisor (also dropping the redundant `.0`).
- **Specs**: rather than rewriting test fixtures such as `965738495` purely to appease a linter, exclude the frontend specs from the PMD `InnaccurateNumericLiteral` rule via `.codacy.yml` (same mechanism already used for other engines' `exclude_paths`).

Note: only a Codacy scan can confirm the rewritten forms are accepted by PMD; if `BytesUnitConverter.js` is still flagged after the rewrite, fall back to excluding it too.
