# Refactor: expose BaseListItem literals as readonly fields

## Context

Codacy's ESLint scan (`@typescript-eslint/class-literal-property-style`, BestPractice, Info severity) flags two literal class members in `frontend/assets/js/components/common/list_types/BaseListItem.js` (lines 43 and 54) that should be exposed as readonly fields instead of getters, per the rule's guidance — getters returning a constant literal add indirection with no benefit over a plain readonly field.

## What needs to be done

Frontend: convert the two flagged getters in `BaseListItem.js:43` and `:54` into readonly class field declarations, updating any call sites if the access pattern changes.

## Acceptance criteria

- [ ] Both flagged members are readonly fields instead of getters
- [ ] Existing BaseListItem specs still pass
- [ ] Codacy's ESLint `class-literal-property-style` finding clears for this file
