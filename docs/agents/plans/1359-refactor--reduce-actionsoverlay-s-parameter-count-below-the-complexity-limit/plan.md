# Plan: Refactor: reduce ActionsOverlay's parameter count below the complexity limit

Issue: [1359-refactor--reduce-actionsoverlay-s-parameter-count-below-the-complexity-limit.md](../issues/1359-refactor--reduce-actionsoverlay-s-parameter-count-below-the-complexity-limit.md)

## Overview

`ActionsOverlay` takes 9 props, one over Codacy Lizard's `parameter-count-medium` limit. Consolidate the `grayscale` and `dimmed` visual-state booleans into a single `photoState` object prop, and update every call site (direct JSX usages and the one config that constructs these props for a spread) plus affected specs to match.

See [frontend.md](frontend.md) for the full plan.
