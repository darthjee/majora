# Plan: Retrofit exchange tabs to use shared two-column layout component

Issue: [988-retrofit-exchange-tabs-to-use-shared-two-column-layout-component.md](../../issues/988-retrofit-exchange-tabs-to-use-shared-two-column-layout-component.md)

## Overview

Retrofit the 8 resource-exchange tab helpers under
`frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/` to render through
the shared `TwoColumnLayout` component (`frontend/assets/js/components/common/layout/TwoColumnLayout.jsx`,
landed in #827) instead of their own hand-rolled `row`/`col-6` conditional. Along the way, unify all
8 helpers onto the same internal structure (a private `#renderDetailPane(state, handlers)` method,
already used by half of them) and update their Jasmine specs to assert against `TwoColumnLayout`'s
props instead of the removed inline markup. Purely a frontend refactor — no behavior change, no new
endpoints, no backend/model/access-control involvement.

## Context

`TwoColumnLayout` (props `browsePane`/`detailPane`, where a falsy `detailPane` collapses to
single-column) already exists and has a working consumer: `GiveItemModalHelper.render`
(`frontend/assets/js/components/resources/item/pages/elements/helpers/GiveItemModalHelper.jsx:34-53`)
calls it unconditionally, passing `detailPane={null}` when there's nothing to show on the right.
Its spec, `GiveItemModalHelperSpec.js`, uses a `findElement` helper
(`frontend/specs/assets/js/components/resources/item/pages/elements/helpers/support.js`) that walks
**every** prop value of a node (not just `children`), specifically so elements passed through named
props like `browsePane`/`detailPane` are still reachable — and asserts directly against
`layout.props.detailPane` being `null`/non-null. This is the exact pattern to replicate across the
8 tab helpers and their specs.

Today, each of the 8 helpers repeats (see e.g. `BuyTreasureTabHelper.jsx:33-61`):

```jsx
static render(state, handlers) {
  const { selected } = state;
  if (!selected) {
    return Helper.#renderBrowsePane(state, handlers);
  }
  return (
    <div className="row">
      <div className="col-6">{Helper.#renderBrowsePane(state, handlers)}</div>
      <div className="col-6">{/* detail pane, inline or via #renderDetailPane */}</div>
    </div>
  );
}
```

4 of the 8 (`AcquireDocumentTabHelper`, `AcquireItemTabHelper`, `RemoveDocumentTabHelper`,
`RemoveItemTabHelper`) already delegate the detail-pane markup to a private
`#renderDetailPane(state, handlers)` method (see `AcquireItemTabHelper.jsx:52-90` for the fullest
example — it reads `selected`/etc. straight off `state`, not from method params). The other 4
(`BuyTreasureTabHelper`, `SellTreasureTabHelper`, `AcquireTreasureTabHelper`,
`RemoveTreasureTabHelper`) build their `ExchangeDetailPane` element inline inside `render()`.

Every affected spec's `selectedItemSpec.js` currently has one assertion tied to the old markup:
`expect(JSON.stringify(element)).toContain('row');` — confirmed present (identically) in all 8
files' `selectedItemSpec.js`. Their per-directory `support.js` `findElement` walks only
`node.props?.children`, which will no longer reach content passed through `TwoColumnLayout`'s
`browsePane`/`detailPane` props once the refactor lands.

## Implementation Steps

### Step 1 — Extract `#renderDetailPane` in the 4 inline-building helpers

For `BuyTreasureTabHelper`, `SellTreasureTabHelper`, `AcquireTreasureTabHelper`,
`RemoveTreasureTabHelper`: extract the `<ExchangeDetailPane ... />` construction currently inline
in `render()`'s two-column branch into a new private `static #renderDetailPane(state, handlers)`
method, reading `selected` and any derived values (e.g. `owned`) from `state` inside that method —
matching the shape of `AcquireItemTabHelper.#renderDetailPane`. Don't change any prop passed to
`ExchangeDetailPane` — this step only moves code, it doesn't alter behavior.

### Step 2 — Switch `render()` to call `TwoColumnLayout` unconditionally

In all 8 helpers, replace the `if (!selected) { return #renderBrowsePane(...) } return (<div
className="row">...)` conditional with:

```jsx
static render(state, handlers) {
  const { selected } = state;

  return (
    <TwoColumnLayout
      browsePane={Helper.#renderBrowsePane(state, handlers)}
      detailPane={selected ? Helper.#renderDetailPane(state, handlers) : null}
    />
  );
}
```

Import `TwoColumnLayout` from `../../../../../../common/layout/TwoColumnLayout.jsx` (adjust the
relative path per each file's actual nesting depth — verify against an existing import in the same
file, e.g. how `BrowsePager` is imported). `TwoColumnLayoutHelper.render` already returns just
`browsePane` when `detailPane` is falsy, so no separate single-column branch is needed anymore.
Remove the now-dead `row`/`col-6` JSX and the `if (!selected)` branch entirely.

Preserve everything else about each helper's public contract: `render(state, handlers)` signature,
JSDoc, and exactly which props/handlers reach the detail pane.

### Step 3 — Update specs: widen `findElement`

For each of the 8 spec directories under
`frontend/specs/assets/js/components/resources/character/pages/elements/tabs/helpers/<Helper>/`,
update the local `support.js`'s `findElement` to walk all prop values of a node, not just
`props.children` — copy the shape already used in
`frontend/specs/assets/js/components/resources/item/pages/elements/helpers/support.js` (falls
through to `Object.values(node.props)` when the top-level matcher and `children` traversal don't
find a match). Keep each directory's own local copy (matching this codebase's existing
per-directory `support.js` convention — not a shared/extracted utility).

### Step 4 — Update specs: assert against `TwoColumnLayout`

In each `selectedItemSpec.js`, replace:

```js
expect(JSON.stringify(element)).toContain('row');
```

with an assertion that `TwoColumnLayout` is rendered with a non-null `detailPane`, e.g.:

```js
const layout = findElement(element, (node) => node.type === TwoColumnLayout);
expect(layout.props.detailPane).not.toBeNull();
```

(import `TwoColumnLayout` from `../../../../../../../../../../../assets/js/components/common/layout/TwoColumnLayout.jsx`,
adjusting the relative depth to match each spec file's existing imports). Leave every other
assertion in `selectedItemSpec.js` as-is — they already locate `ExchangeDetailPane` (or the
helper's own detail markup) via `findElement` and check its props, which keeps working once
`findElement` is widened in Step 3.

In each `browseListSpec.js`, no assertion currently checks `row`/`col-6`, but confirm the widened
`findElement` from Step 3 still locates `BrowsePager` and other browse-pane content correctly now
that it's reached through `TwoColumnLayout`'s `browsePane` prop instead of being the top-level
returned element's `children` directly (single-column case: `render()` now returns
`<TwoColumnLayout browsePane={...} detailPane={null} />` instead of the browse-pane fragment
directly).

Add one test per helper (if not effectively already covered) asserting `detailPane` is
`null`/falsy when nothing is selected, mirroring `GiveItemModalHelperSpec`'s `"passes a null
detailPane to TwoColumnLayout when the receiving list is empty"` test — this is the explicit
single-column-vs-two-column coverage the issue calls out.

### Step 5 — Lint and test

Run lint and the full Jasmine suite (see CI Checks below) across all 8 helpers + specs together
before considering the change done, since all 8 land in a single PR.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/BuyTreasureTabHelper.jsx` — extract `#renderDetailPane`, switch to `TwoColumnLayout`.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/SellTreasureTabHelper.jsx` — same.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireTreasureTabHelper.jsx` — same.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveTreasureTabHelper.jsx` — same.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireItemTabHelper.jsx` — switch to `TwoColumnLayout` (already has `#renderDetailPane`).
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveItemTabHelper.jsx` — same.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireDocumentTabHelper.jsx` — same.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveDocumentTabHelper.jsx` — same.
- `frontend/specs/.../tabs/helpers/BuyTreasureTabHelper/support.js` — widen `findElement`.
- `frontend/specs/.../tabs/helpers/BuyTreasureTabHelper/selectedItemSpec.js` — assert against `TwoColumnLayout`.
- (same two files, mirrored, for `SellTreasureTabHelper`, `AcquireTreasureTabHelper`, `RemoveTreasureTabHelper`, `AcquireItemTabHelper`, `RemoveItemTabHelper`, `AcquireDocumentTabHelper`, `RemoveDocumentTabHelper`)
- `frontend/specs/.../tabs/helpers/*/browseListSpec.js` (all 8) — verify still passes against the widened `findElement`; add a `detailPane` null-check test if not already covered by `selectedItemSpec.js`'s unselected-state cases.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- No behavior change is intended anywhere — this is a structural refactor only. Every prop/handler
  currently reaching `ExchangeDetailPane` (or each item/document helper's own detail markup) must
  keep reaching it unchanged.
- All 8 files ship in a single PR per the issue's explicit scope decision — the change is
  mechanically identical across all of them.
- `TwoColumnLayout`'s import path differs by file depth; verify against each file's existing
  relative imports (e.g. `BrowsePager`) rather than assuming a fixed `../` count.
