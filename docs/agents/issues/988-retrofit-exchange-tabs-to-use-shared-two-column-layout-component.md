# Retrofit exchange tabs to use shared two-column layout component

## Context

Issue #827 (Add give item option) introduced the shared two-column layout component,
`TwoColumnLayout` (`frontend/assets/js/components/common/layout/TwoColumnLayout.jsx`, props
`browsePane`/`detailPane`, where a `null`/absent `detailPane` renders single-column), for the
give-item modal. #827 has already landed, so the component exists in the codebase today — this
issue is no longer blocked on anything. It factors out a pattern that is currently duplicated
across the 8 existing resource-exchange tab helpers under
`frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/`:

- `BuyTreasureTabHelper.jsx`
- `SellTreasureTabHelper.jsx`
- `AcquireTreasureTabHelper.jsx`
- `RemoveTreasureTabHelper.jsx`
- `AcquireItemTabHelper.jsx`
- `RemoveItemTabHelper.jsx`
- `AcquireDocumentTabHelper.jsx`
- `RemoveDocumentTabHelper.jsx`

Each of these `render(state, handlers)` methods currently repeats the same conditional (see e.g.
`BuyTreasureTabHelper.jsx:33-61`): render just the browse pane when nothing is selected, otherwise
wrap the browse pane and a detail pane (e.g. `ExchangeDetailPane`) in a Bootstrap `row`/`col-6`
layout by hand. Issue #827 explicitly scoped retrofitting these 8 files out of its own work and
tracked it as this follow-up cleanup issue.

## What needs to be done

Frontend:

- In each of the 8 tab helper files listed above, replace the hand-rolled
  `if (!selected) { ...single column... } return (<div className="row">...<div className="col-6">
  ...` conditional with a single, unconditional call to `TwoColumnLayout`, matching the pattern
  `GiveItemModalHelper.render` already established in #827: pass the existing browse-pane render
  output as `browsePane`, and the existing detail-pane element (e.g. `ExchangeDetailPane`, or
  whichever detail component that helper already renders) as `detailPane` when something is
  selected, or `null` otherwise. `TwoColumnLayoutHelper` itself already collapses to single-column
  whenever `detailPane` is falsy, so the helpers no longer need their own early-return branch for
  the unselected case.
- Preserve each helper's existing public behavior exactly: same props/JSDoc contract for
  `render(state, handlers)`, same conditions for switching between single-column and two-column,
  same content and handlers passed into the detail pane.
- Unify detail-pane construction across all 8 helpers onto the private `#renderDetailPane(state,
  handlers)` method pattern already used by `AcquireDocumentTabHelper`, `AcquireItemTabHelper`,
  `RemoveDocumentTabHelper`, and `RemoveItemTabHelper`. The other 4 (`BuyTreasureTabHelper`,
  `SellTreasureTabHelper`, `AcquireTreasureTabHelper`, `RemoveTreasureTabHelper`) currently build
  their detail-pane element inline inside `render()` — extract that into a `#renderDetailPane`
  method of their own as part of this retrofit, so all 8 helpers follow the same structure.
  `#renderDetailPane` should itself return `null` when nothing is selected (folding the
  selected-vs-not branch into that method rather than into `render()`).
- Remove the now-duplicated `row`/`col-6` markup once the shared component supersedes it.
- Update the existing Jasmine specs for these 8 helpers to match the pattern already used by
  `GiveItemModalHelperSpec` (#827): widen each spec folder's local `findElement` helper to walk
  all prop values (not just `children`), so elements passed via `TwoColumnLayout`'s `browsePane`/
  `detailPane` props are still reachable — not just `props.children` as today. Replace assertions
  like `expect(JSON.stringify(element)).toContain('row')` with assertions against `TwoColumnLayout`
  itself (`findElement(element, (node) => node.type === TwoColumnLayout)`), checking that
  `detailPane` is `null`/falsy in the single-column case and non-null once something is selected —
  mirroring `GiveItemModalHelperSpec`'s `"passes a null/non-null detailPane to TwoColumnLayout"`
  tests. Don't weaken coverage of the single-column vs. two-column switch in the process.

Scope: land all 8 helpers in a single PR. The change is mechanically identical across all of
them, so reviewing them together keeps the pattern consistent and avoids repeated review overhead
for what's really one refactor.

## Acceptance criteria

- [ ] All 8 tab helpers (`BuyTreasureTabHelper`, `SellTreasureTabHelper`,
      `AcquireTreasureTabHelper`, `RemoveTreasureTabHelper`, `AcquireItemTabHelper`,
      `RemoveItemTabHelper`, `AcquireDocumentTabHelper`, `RemoveDocumentTabHelper`) use the shared
      two-column layout component instead of their own inline `row`/`col-6` conditional.
- [ ] No duplicated `row`/`col-6` wrapping markup remains in any of the 8 files.
- [ ] Each tab still renders single-column when nothing is selected and two-column (browse +
      detail) once a selection is made, matching current behavior.
- [ ] All 8 helpers build their detail-pane element via a private `#renderDetailPane(state,
      handlers)` method (rather than inline in `render()`), matching the pattern already used by
      `AcquireDocumentTabHelper`/`AcquireItemTabHelper`/`RemoveDocumentTabHelper`/
      `RemoveItemTabHelper`.
- [ ] Existing Jasmine specs for the 8 helpers pass, updated to assert against `TwoColumnLayout`'s
      `browsePane`/`detailPane` props (via a `findElement` that walks all prop values, not just
      `children`) instead of the removed inline `row`/`col-6` markup.
- [ ] ESLint passes with no new violations.
