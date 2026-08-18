# Plan: Refactor functions with too many parameters (Lizard parameter-count-medium)

Issue: [1153-refactor-functions-with-too-many-parameters--lizard-parameter-count-medium.md](../../issues/1153-refactor-functions-with-too-many-parameters--lizard-parameter-count-medium.md)

## Overview

Group the parameters of 14 flagged `frontend/` functions/components into single objects
(reusing the repo's existing `context`/`handlers` convention where it fits) to bring them
under Lizard's 8-parameter limit, updating every call site and JSDoc block in lockstep.

See [frontend.md](frontend.md) for the full plan.
