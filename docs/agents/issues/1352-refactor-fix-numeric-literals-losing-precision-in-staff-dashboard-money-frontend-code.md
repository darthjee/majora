# Refactor: fix numeric literals losing precision in staff_dashboard/money frontend code

## Context

Codacy's PMD scan (`InnaccurateNumericLiteral`, ErrorProne, High severity) flags 13 numeric literals across the frontend byte/money conversion code and its specs as losing precision at runtime — values like `965738495`, `965738496`, `1073741824.0`, `100000000`, and `10000002` are outside JS's safe-integer/float-literal representation for the way they're written, so the literal's runtime value can silently differ from what's written in source.

## What needs to be done

Frontend: review each flagged literal in `BytesUnitConverter.js`/`BytesUnitConverterSpec.js`, `MetricDisplaySpec.js`, `SizeDisplaySpec.js`, `TreasureMoneySpec.js`, `TreasureMoneyHelperSpec.js`, and `DndMoneyModelSpec.js`, and rewrite them (e.g. using `Number.MAX_SAFE_INTEGER`-safe forms, `1024 ** 3` instead of a raw literal, or explicit `BigInt`/exponential notation where appropriate) so the literal's written value matches its runtime value.

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

## Acceptance criteria

- [ ] Each flagged literal is rewritten so its written value matches its actual runtime value
- [ ] The affected specs and the component under test still pass (`yarn test`)
- [ ] Codacy's PMD `InnaccurateNumericLiteral` finding count drops to 0 for these files
