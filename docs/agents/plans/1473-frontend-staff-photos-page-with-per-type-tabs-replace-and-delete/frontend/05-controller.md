# StaffPhotosController

`components/resources/staff_photo/pages/controllers/StaffPhotosController.js`, extending `BasePageController`, modelled on `StaffUsersController`.

- `buildEffect()`: `AccessStore.ensureStaffOrSuperUser()`; non-staff → `window.location.hash = '/'`. Otherwise `RequestStore.ensure({ resource: 'staffPhoto', quantityType: 'index' })` → store `types` and `max_dimension`; resolve the current type from the hash `type` param (`HashRouteResolver#getFilterParams().get('type')` or `HashQueryParams`) via `resolveType`; then fetch the list.
- `fetchList()`: `RequestStore.ensure({ resource: 'staffPhoto', quantityType: 'collection', params: { photoType }, query: paginationParams })` → `{ data, pagination }`. Query contains pagination params only (never `type`).
- `handleDelete(photo)`: `RequestStore.mutate({ resource: 'staffPhoto', method: 'DELETE', quantityType: 'single', params: { photoType, id: photo.id }, variantName: 'regular' })`. On ok the list cache is purged by `mutate`; refetch. On not-ok map the status with the error helper; on 404 additionally `RequestStore.purge({ resource: 'staffPhoto' })` and refetch. Network errors → generic.
- `handleReplaceSuccess(photo)`: `RequestStore.purge({ resource: 'staffPhoto' })`, record `versions[photo.id] = Date.now()`, refetch.
- `handleReplaceError(photo, status)`: map the status with the error helper; on 404 purge and refetch.
- `replacePath(photo)`: `/staff/photos/${photoType}/${photo.id}/replace.json` (or via `RequestStore.resolvePath` if a `POST.replace` entry is added).
- Use safe setters (`buildSafeSetter`) so updates after unmount are ignored.

Split specs per method under `frontend/specs/assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController/` with a `support.js`.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController.js` — new
- `frontend/specs/assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController/*Spec.js` + `support.js` — new
