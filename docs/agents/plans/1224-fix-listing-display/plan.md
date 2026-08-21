# Plan: Fix listing display: flexible column grid leaks to non-game list types

Issue: [1224-fix-listing-display.md](../../issues/1224-fix-listing-display.md)

## Overview
PR #1211 added a flexible column grid (columns shrink to fill the row when fewer items than the row's normal capacity exist) to `ListPageHelper`, but applied it unconditionally to all ~20 list types instead of only `games`/`my-games`. This plan adds a per-type `flexibleColumns` config flag, threads it through `ListPageHelper`, and updates the affected specs. Single-owner change, entirely within `frontend/`.

See [frontend.md](frontend.md) for the full plan.
