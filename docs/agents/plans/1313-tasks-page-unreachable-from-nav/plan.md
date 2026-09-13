# Plan: Tasks page unreachable from nav

Issue: [1313-tasks-page-unreachable-from-nav.md](../issues/1313-tasks-page-unreachable-from-nav.md)

## Overview

Add a new derived `isDmOrAdmin` context flag and gate the already-existing `GameTasks` page behind a `gameItem(...)` entry in the header's Game nav dropdown, placed after Sessions and before Photos, restricted to DM/staff/superuser (excluding regular players) to match the backend's `restricted`/`edit` permission on tasks. Plus its `en`/`pt` translation.

See [frontend.md](frontend.md) for the full plan.
