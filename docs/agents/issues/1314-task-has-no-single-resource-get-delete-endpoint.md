# Issue: Task has no single-resource GET endpoint

## Description

The `Task` resource's backend API only supports listing/creating and updating tasks. There is no endpoint to fetch a single task by id, and no endpoint to delete one.

## Problem

The backend currently exposes only:

- `GET/POST /games/<game_slug>/tasks.json` (list / create) — `backend/games/views/game_tasks/game_tasks_list.py`
- `PATCH /games/<game_slug>/tasks/<task_id>.json` (update) — `backend/games/views/game_tasks/game_task_detail.py`

There is no `GET /games/<game_slug>/tasks/<task_id>.json` for a single task, and no `DELETE` route for a task at all.

This gap was noticed while investigating #1313 (Tasks page unreachable from nav) — it is not currently blocking anything, since the frontend (`GameTasksController`) gets task data from the list response and doesn't need a standalone GET.

## Expected Behavior

A single task can be fetched directly by id via `GET /games/<game_slug>/tasks/<task_id>.json`, following the same URL/view/permission pattern as the existing `game_task_detail` view (`backend/games/views/game_tasks/game_task_detail.py:19`, routed at `backend/games/urls/games.py:431`).

## Solution

- Add a `GET` handler to `game_task_detail` (or a sibling view reusing the same URL) that returns a single task's detail, gated by `EndpointPermission(..., 'game_task', 'restricted', 'edit')` — the same gate already used by the list/update endpoints, matching the existing comment that Task has no public read path.
- `DELETE` is out of scope for this issue until a product need for deleting tasks is identified — tracked separately if it comes up.

Related: #1313
