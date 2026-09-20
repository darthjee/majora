# Plan: Refactor: avoid assignment-in-operand in frontend/assets/js/components/common/list_types/listTypeConfig.js

Issue: [1376-refactor-avoid-assignment-in-operand-in-frontend-assets-js-components-common-list-types-listtypeconfig-js.md](../../issues/1376-refactor-avoid-assignment-in-operand-in-frontend-assets-js-components-common-list-types-listtypeconfig-js.md)

## Overview
Extract the `window.location.hash` assignment flagged by Codacy's PMD `AssignmentInOperand` rule out of the nested `onClick` arrow function in `listTypeConfig.js` into a named helper.

See [frontend.md](frontend.md) for the full plan.
