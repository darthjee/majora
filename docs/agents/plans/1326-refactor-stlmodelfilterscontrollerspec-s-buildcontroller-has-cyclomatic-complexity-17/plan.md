# Plan: Refactor: StlModelFiltersControllerSpec's buildController has cyclomatic complexity 17

Issue: [1326-refactor-stlmodelfilterscontrollerspec-s-buildcontroller-has-cyclomatic-complexity-17.md](../../issues/1326-refactor-stlmodelfilterscontrollerspec-s-buildcontroller-has-cyclomatic-complexity-17.md)

## Overview
Collapse `buildController`'s eight chained `??` fallbacks in `StlModelFiltersControllerSpec.js` into a single default-merge, bringing its Lizard cyclomatic complexity back under the limit without changing test behavior.

See [frontend.md](frontend.md) for the full plan.
