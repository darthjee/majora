# Extract GameEdit's field-sync/redirect effect into a hook

`GameEdit` (`frontend/assets/js/components/resources/game/pages/GameEdit.jsx:32`, 51 lines) inlines a `canReachEditPage` module-level helper (lines 20–22) plus a `useEffect` (lines 54–68) that: redirects away when the loaded `game` isn't reachable by the current user, otherwise syncs `name`/`description`/`links` from `game` into local form state.

Extract this into a new hook, `hooks/useSyncGameFields.js` (new `hooks/` folder alongside `controllers/`, `helpers/`, `elements/`), taking `(game, gameSlug, setField, setLinks)` and internally:

- Keeping (or importing, if reused elsewhere — check first) the `canReachEditPage(game)` check.
- Performing the redirect (`window.location.hash = ...`) when unreachable.
- Calling `setField('name', ...)`, `setField('description', ...)`, `setLinks(...)` when reachable.
- Preserving the existing `[game]` dependency array and its `eslint-disable-next-line react-hooks/exhaustive-deps` comment.

`GameEdit` then replaces its inline `useEffect` (and the module-level `canReachEditPage`, if not needed elsewhere in the file) with a single `useSyncGameFields(game, gameSlug, setField, setLinks)` call.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/hooks/useSyncGameFields.js` — new hook, per above.
- `frontend/assets/js/components/resources/game/pages/GameEdit.jsx` — replace the inline effect (and `canReachEditPage`, if now unused here) with the new hook call.
