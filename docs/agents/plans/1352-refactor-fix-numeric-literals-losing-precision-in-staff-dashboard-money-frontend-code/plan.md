# Plan: Refactor: fix numeric literals losing precision in staff_dashboard/money frontend code

Issue: [1352-refactor-fix-numeric-literals-losing-precision-in-staff-dashboard-money-frontend-code.md](../../issues/1352-refactor-fix-numeric-literals-losing-precision-in-staff-dashboard-money-frontend-code.md)

## Overview
Codacy's PMD `InnaccurateNumericLiteral` flags 13 frontend numeric literals that are actually exact at runtime (false positives). Rewrite the flagged constants in `BytesUnitConverter.js` as derived expressions and exclude the frontend specs from the PMD engine in `.codacy.yml`.

See [frontend.md](frontend.md) for the full plan.
