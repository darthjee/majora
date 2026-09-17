# Refactor: reduce ActionsOverlay's parameter count below the complexity limit

## Context

Codacy's Lizard scan (`parameter-count-medium`, Complexity, Warning severity) flags `frontend/assets/js/components/common/misc/ActionsOverlay.jsx:62` — the `ActionsOverlay` component takes 9 parameters, one over the 8-parameter guideline, making its call sites harder to read and its prop surface harder to reason about.

## What needs to be done

Frontend: group related props on `ActionsOverlay` into a single options object (or otherwise consolidate them) so the component's parameter count drops to 8 or fewer, updating call sites accordingly.

## Acceptance criteria

- [ ] `ActionsOverlay` takes 8 or fewer parameters
- [ ] All call sites and specs referencing `ActionsOverlay` are updated and passing
- [ ] Codacy's Lizard `parameter-count-medium` finding clears for this file
