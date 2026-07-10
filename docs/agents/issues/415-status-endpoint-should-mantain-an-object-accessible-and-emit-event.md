# Issue: Status endpoint should mantain an object accessible and emit event

## Description
Several frontend pages request access-check endpoints (`.../access.json` for games, characters, and treasures, plus the staff/superuser check in `AdminAccess.js`) to determine whether the current user has access to a given resource. This data is currently fetched and used ad hoc wherever it's needed, but it is never persisted in a shared object — each consumer (page controller) re-requests it independently, merging the result directly into local component state.

## Problem
Because access-check results aren't centralized, there's no single source of truth for the current user's access state. This leads to duplicated requests (`GameClient.fetchGameAccess`, `CharacterClient.fetchCharacterAccess`, `TreasureClient.fetchTreasureAccess`, `AdminAccess`'s staff/superuser check), no coordinated invalidation on route changes or auth events (login/logout), and no way for one part of the app to react when another part's access check completes.

## Expected Behavior
- A frontend object maintains the current access state (game, character, treasure, and staff/superuser access), driven by a configuration mapping routes to the access request(s) they require.
- On every route change, the object's state is cleared; if the new route requires an access check, a new request is triggered automatically. The custom hash-based router's route-change hook (`AppController.buildEffect`) is the natural integration point.
- Login and logout events (currently emitted via `AuthEvents`) trigger a reload of the access data via a new request.
- If an access request is already in flight when a login or logout event happens, that in-flight request is cancelled and a new one is started.
- While a request is in flight, any access check against the object returns "no access" (fail-closed) until the request resolves.
- When a request finishes, the object emits an event so other objects/components relying on it can re-check. This should follow the existing pub-sub convention already used by `AuthEvents` and `LanguageEvents` (a static class emitting a `window` `CustomEvent`), for consistency.
- Other parts of the app read access state only through the object's methods, not by requesting the access endpoints directly.
- Existing callers that currently fetch and merge access data themselves (`GameController`, `CharacterController`, `TreasureController`, and the related New/Edit controllers, plus any direct `AdminAccess` usage) are migrated to read from this new object instead of calling the access endpoints/clients directly.

## Benefits
- Single source of truth for access state, avoiding duplicated access-check requests across game, character, treasure, and admin checks.
- Consistent, fail-closed behavior while access is being (re)checked.
- Automatic, event-driven propagation of access changes to dependent UI without manual polling or prop drilling.
- Codebase-wide consistency, since all controllers consume access state the same way and the object follows the existing `AuthEvents`/`LanguageEvents` pub-sub convention.
