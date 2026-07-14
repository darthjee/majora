# Issue: Organize frontend utils

## Description
The files under `frontend/assets/js/utils` are currently all placed flat in a single directory, mixing access-control stores, auth helpers, routing helpers, money/treasure helpers, logging/event trackers, and UI display helpers together. This mirrors how `frontend/assets/js/components` is already organized into `common/`, `helpers/`, and `resources/` subfolders, and how `utils/money` and `utils/config` already exist as subfolders.

## Problem
With ~28 files (2117 lines) flat in one directory, it's hard to tell at a glance which utilities are related, and new utilities have no obvious home, encouraging further flat sprawl.

## Expected Behavior
Utilities are grouped into subfolders by domain/responsibility, matching corresponding spec files under `frontend/specs/assets/js/utils`. Existing subfolders (`money/`, `config/`) are preserved. All ~47 non-spec files and ~153 spec files that currently import from `utils/` are updated to the new paths.

## Solution
Agreed grouping:

- `access/` — AccessCache, AccessEvents, accessRouteConfig, AccessRouteConfigStore
  - `access/store/` — AccessStore, AccessStoreAccess, AccessStoreAdmin, AccessStoreDescriptor, AccessStoreFacade, AccessStoreKeys, AccessStoreLogging, AccessStorePermissions
- `auth/` — AuthEvents, AuthStorage
- `routing/` — Route, Router, HashRouteResolver, HashQueryParams
- `money/` (existing) — DndMoneyModel, MoneyModelRegistry, plus CoinBreakdown, mergeCharacterTreasureQuantity
- `logging/` — MajoraLogger, ResilienceEvents, ActivityTracker
- `ui/` — Icons, AllegianceBorder
- `config/` (existing, unchanged) — activityEndpoints.js
- Stays at `utils/` root — Noop.js (generic, domain-less primitive)

File names are unchanged by the move (e.g. `AccessStore.js` becomes `access/store/AccessStore.js`), so the diff stays a pure move-and-relink, no renames bundled in.

Spec files move to mirror their source file's new location, including the existing `specs/.../utils/AccessStore/` nested spec folder moving to `specs/.../utils/access/store/`.

The full move (all ~47 non-spec importers and ~153 spec importers) is done in one pass rather than staged incrementally.

## Benefits
- Related utilities are discoverable by folder instead of by scanning a flat list of ~28 files
- Matches the existing organization convention already used in `components/` and `utils/money`, `utils/config`
- Gives new utilities an obvious home going forward
