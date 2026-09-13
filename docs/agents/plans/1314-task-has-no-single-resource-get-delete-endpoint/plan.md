# Plan: Task has no single-resource GET endpoint

Issue: [1314-task-has-no-single-resource-get-delete-endpoint.md](../../issues/1314-task-has-no-single-resource-get-delete-endpoint.md)

## Overview

Add a `GET` handler to the existing `game_task_detail` view so a single task can be fetched by id, reusing the same URL and the same restricted `edit` permission gate already used by the list/PATCH endpoints. `DELETE` stays out of scope.

See [backend.md](backend.md) for the full plan.
