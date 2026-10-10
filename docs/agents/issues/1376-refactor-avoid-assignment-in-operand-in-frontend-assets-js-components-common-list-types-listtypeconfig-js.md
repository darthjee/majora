# Refactor: avoid assignment-in-operand in frontend/assets/js/components/common/list_types/listTypeConfig.js

## Context

Codacy's PMD scan (`AssignmentInOperand`, CodeStyle, Info severity) flags `frontend/assets/js/components/common/list_types/listTypeConfig.js:73` for an assignment used inside an operand (e.g. inside a condition or expression), which is easy to misread as an equality comparison and can hide subtle bugs when the surrounding code changes.

## What needs to be done

Frontend: refactor `listTypeConfig.js:73` to move the assignment onto its own statement before the expression that uses it, so the operand only reads the already-assigned value.

## Acceptance criteria

- [ ] listTypeConfig.js:73 no longer performs an assignment inside an operand
- [ ] Existing specs covering listTypeConfig.js still pass
- [ ] Codacy's PMD `AssignmentInOperand` finding clears for this file
