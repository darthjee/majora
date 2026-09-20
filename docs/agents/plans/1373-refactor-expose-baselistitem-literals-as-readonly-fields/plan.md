# Plan: Refactor: expose BaseListItem literals as readonly fields

Issue: [1373-refactor-expose-baselistitem-literals-as-readonly-fields.md](../../issues/1373-refactor-expose-baselistitem-literals-as-readonly-fields.md)

## Overview
Clear Codacy's `@typescript-eslint/class-literal-property-style` finding on `BaseListItem.js` by suppressing the rule on the two intentionally-overridable getters (`formattedValue`, `availabilityText`) rather than converting them to class fields, which would shadow the subclass getter overrides.

See [frontend.md](frontend.md) for the full plan.
