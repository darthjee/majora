# Retrofit exchange tabs to use shared two-column layout component

## Context

Issue #827 (Add give item option) introduces a shared two-column layout component
(`browsePane`/`detailPane` props, where a `null`/absent `detailPane` renders single-column) for
the new give-item modal. That component factors out a pattern that is currently duplicated across
the 8 existing resource-exchange tab helpers under
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

Frontend (depends on the shared layout component landing in #827 first):

- In each of the 8 tab helper files listed above, replace the hand-rolled
  `if (!selected) { ...single column... } return (<div className="row">...<div className="col-6">
  ...` conditional with a call to the shared two-column layout component introduced in #827,
  passing the existing browse-pane render output as `browsePane` and the existing detail-pane
  element (e.g. `ExchangeDetailPane`, or whichever detail component that helper already renders)
  as `detailPane` (or `null`/absent when nothing is selected).
- Preserve each helper's existing public behavior exactly: same props/JSDoc contract for
  `render(state, handlers)`, same conditions for switching between single-column and two-column,
  same content and handlers passed into the detail pane.
- Remove the now-duplicated `row`/`col-6` markup and any private helper methods that existed
  solely to build that wrapping, once the shared component supersedes them.
- Update/adjust existing Jasmine specs for these 8 helpers so they assert against the shared
  layout component's rendering rather than the removed inline markup, without weakening test
  coverage of the single-column vs. two-column switch.

Docs:

- If `docs/agents/architecture.md` or any other doc references the old duplicated pattern for
  these tabs, update it to point at the shared layout component instead.

## Acceptance criteria

- [ ] All 8 tab helpers (`BuyTreasureTabHelper`, `SellTreasureTabHelper`,
      `AcquireTreasureTabHelper`, `RemoveTreasureTabHelper`, `AcquireItemTabHelper`,
      `RemoveItemTabHelper`, `AcquireDocumentTabHelper`, `RemoveDocumentTabHelper`) use the shared
      two-column layout component instead of their own inline `row`/`col-6` conditional.
- [ ] No duplicated `row`/`col-6` wrapping markup remains in any of the 8 files.
- [ ] Each tab still renders single-column when nothing is selected and two-column (browse +
      detail) once a selection is made, matching current behavior.
- [ ] Existing Jasmine specs for the 8 helpers pass, updated as needed to reflect the shared
      component usage.
- [ ] ESLint passes with no new violations.
