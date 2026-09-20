# Frontend Plan: Refactor: fix numeric literals losing precision in staff_dashboard/money frontend code

Main plan: [plan.md](plan.md)

## Overview
Verified in Node that every flagged literal (`965738495`, `965738496`, `1073741824.0`, `100000000`, `10000002`) is an exactly representable safe integer, so the findings are false positives. The goal is to clear them without changing runtime behavior.

## Context
- `BytesUnitConverter.js` thresholds are derived from 921 (≈90% of 1024): `943104 = 921 * 1024`, `965738496 = 921 * 1024 ** 2`.
- `.codacy.yml` already uses per-engine `exclude_paths` (duplication, bandit, phpmd, phpcs) for test paths.

## Implementation Steps

### Step 1 — Rewrite literals in `BytesUnitConverter.js`
Replace the flagged `965738496` threshold with `921 * 1024 ** 2` and the `1073741824.0` GB divisor with `1024 ** 3`. For consistency, express the sibling constants the same way (`921 * 1024`, `1024`, `1024 ** 2`), dropping redundant `.0`. Values must remain numerically identical; `BytesUnitConverterSpec.js`, `MetricDisplaySpec.js` and `SizeDisplaySpec.js` must keep passing untouched.

### Step 2 — Exclude frontend specs from PMD in `.codacy.yml`
Add a `pmd` engine entry with `exclude_paths: ["frontend/specs/**"]`, mirroring the existing per-engine exclusions, so the spec fixtures (`965738495`, `100000000`, `10000002`, `1073741824.0`, …) are no longer scanned by the rule. Leave spec files unchanged.

## Files to Change
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js` — express thresholds/divisors as derived expressions
- `.codacy.yml` — add `pmd` engine `exclude_paths` for `frontend/specs/**`

## CI Checks
- `frontend`: `yarn test` and `yarn lint` (CI job: frontend tests / `npm run coverage`)

## Notes
- Only a Codacy scan can confirm PMD accepts the rewritten forms; if `BytesUnitConverter.js` is still flagged afterwards, also add `frontend/assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js` to the `pmd` `exclude_paths`.
- `.codacy.yml` is a root-level file; it is assigned to `frontend` here since the exclusion only targets frontend paths.
