# Issue: Refactor: expose BaseListItem literals as readonly fields

## Description
Codacy's ESLint scan (`@typescript-eslint/class-literal-property-style`, BestPractice, Info severity) flags two getters in `frontend/assets/js/components/common/list_types/BaseListItem.js` that return a constant literal (`formattedValue` at line 43 and `availabilityText` at line 54, both `return null`). The rule suggests exposing them as readonly fields instead of getters.

## Problem
Both getters are intentional extension points: `TreasureListItem`, `CollectionListItem` and `GameCommonItemListItem` override them with getters that compute a value lazily from `this.data`. Converting the base getters into class fields would create an own instance property in the base constructor that shadows the subclasses' prototype getters, so those subclasses would silently start returning `null` (breaking `ListPageHelper`, `TreasureCardHelper` and `GameTreasureHelper`, which read these accessors). The finding is therefore a false positive for this class hierarchy.

## Expected Behavior
The Codacy finding on `BaseListItem.js` is cleared without changing the runtime behavior of any `*ListItem` subclass.

## Solution
Keep both accessors as getters (the intentional, overridable extension points) and suppress `@typescript-eslint/class-literal-property-style` on those two lines, following the repo's existing `// eslint-disable-next-line <rule> -- <reason>` convention, with a reason explaining that subclasses override them and a class field would shadow the overrides.

Frontend agent owns the change; no call sites, subclasses or specs need to change.

## Benefits
Clears the Codacy finding while keeping the polymorphic accessor contract of `BaseListItem` intact and avoiding an eager-evaluation behavior change in the subclasses.

## Acceptance Criteria
- [ ] `BaseListItem#formattedValue` and `#availabilityText` remain getters, each preceded by an `eslint-disable-next-line @typescript-eslint/class-literal-property-style -- <reason>` comment
- [ ] Existing BaseListItem and subclass specs still pass, unchanged
- [ ] Local frontend lint still passes (the disable directive must not raise a rule-not-found error if the `@typescript-eslint` plugin isn't loaded locally)
- [ ] Codacy's `class-literal-property-style` finding clears for this file
