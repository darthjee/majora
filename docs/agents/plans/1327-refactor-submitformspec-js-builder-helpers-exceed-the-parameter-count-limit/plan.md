# Plan: Refactor: submitFormSpec.js builder helpers exceed the parameter-count limit

Issue: [1327-refactor-submitformspec-js-builder-helpers-exceed-the-parameter-count-limit.md](../issues/1327-refactor-submitformspec-js-builder-helpers-exceed-the-parameter-count-limit.md)

## Overview

Codacy's Lizard `parameter-count-medium` check flags `buildSubmitFields` (9 params) and `buildExpectedFields` (10 params) in `submitFormSpec.js`. Group the 8 fields shared by both helpers into a `characterFields` sub-object so each drops under the 8-parameter limit, with no production code or behavior changes.

See [frontend.md](frontend.md) for the full plan.
