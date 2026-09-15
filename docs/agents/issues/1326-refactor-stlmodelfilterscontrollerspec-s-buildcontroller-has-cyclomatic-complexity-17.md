# Issue: Refactor: StlModelFiltersControllerSpec's buildController has cyclomatic complexity 17

## Description
Codacy's Lizard code-quality check flags `buildController` in `frontend/specs/assets/js/components/resources/stl_model/pages/elements/controllers/StlModelFiltersControllerSpec.js` with a cyclomatic complexity of 17 (limit is 15).

## Problem
The helper builds a `StlModelFiltersController` test double from eight independent `??` fallbacks — one per setter override. Eight `??` operators in a row is what drives the cyclomatic complexity count; there is no genuinely tangled logic here.

## Solution
Reduce the branching Lizard counts, e.g.:
- default `overrides`' fields via `{ setName: jasmine.createSpy('setName'), ...overrides }` (or similar) up front and drop the per-field `??`, or
- iterate over an array of the 8 setter names to build each spy/override pair in a loop.

Keep `StlModelFiltersController`'s own constructor signature out of scope — this is a test-builder cleanup only.

## Benefits
- Brings `buildController` back under the cyclomatic-complexity limit.
- Keeps the spy/override setup easier to scan and extend if more setters are added later.
