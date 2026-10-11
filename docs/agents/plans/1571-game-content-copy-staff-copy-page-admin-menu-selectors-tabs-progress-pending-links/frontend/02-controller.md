# Controller: staff gate, games, tabs, URL state, list

`StaffCopiesController` (extends `BasePageController`, modeled on `StaffPhotosController`):

- `buildEffect`: `AccessStore.ensureStaffOrSuperUser()` → redirect to `/` if false. Otherwise load `index` (types) and `games` in parallel.
- URL state: read `type`, `from` and `to` from the hash query. `type` defaults to the first type. Changing a selector rewrites the hash (keeping the other params and resetting pagination), which remounts the page like a tab link. Reloading restores the state.
- When `types` is empty, set a `noTypes` state and skip the list fetch. Games and pending links still load.
- When `from === to` (both set), set a validation error (`staff_copies_page.same_game_error`) and skip the list fetch.
- When `type`, `from` and `to` are all valid, fetch `collection` with `{copyType}` params and a `from`/`to` + pagination query.
- A `type` not in `types` (stale URL) falls back to the first type.
- Specs: staff gate (redirect + allowed), parallel loads, URL parsing/defaults, same-game rejection, empty-types state, list fetch + error, stale-type fallback. Use a `support.js` like `StaffPhotosController/`, splitting specs per concern.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/controllers/StaffCopiesController.js` — new.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/controllers/StaffCopiesController/*Spec.js` + `support.js` — new.
