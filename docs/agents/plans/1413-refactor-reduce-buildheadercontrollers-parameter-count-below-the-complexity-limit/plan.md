# Plan: Refactor: reduce buildHeaderControllers' parameter count below the complexity limit

Issue: [1413-refactor-reduce-buildheadercontrollers-parameter-count-below-the-complexity-limit.md](../../issues/1413-refactor-reduce-buildheadercontrollers-parameter-count-below-the-complexity-limit.md)

## Overview
Codacy's Lizard `parameter-count-medium` rule flags `buildHeaderControllers` (11 destructured setters, limit 8). Change it to take three per-controller option objects, and have `useHeaderControllers` build those groups from the flat setters it already receives.

See [frontend.md](frontend.md) for the full plan.
