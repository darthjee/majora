# Wiring: resource config, route, access, menu, UploadClient

Register the page and its request surface, mirroring `staffPhoto`/`staffPhotos`.

- `staffCopyConfig.js`: `permission: null`, identical `regular`/`private` variants (see `staffPhotoConfig.js`). GET: `index` (`/staff/copies.json`), `games` (`/staff/copies/games.json`), `collection` (`/staff/copies/:copyType.json`), `links` (`/staff/copies/links.json`). POST: `copy` (`/staff/copies/:copyType/:id.json`), `renew` (`/staff/copies/links/:uploadId/renew.json`). Use whatever `quantityType` naming the config system supports for the extra endpoints. Check how other configs declare more than `index`/`collection`/`single`.
- Register `staffCopy` in `resourceConfig.js`. Add `staffCopy` to the "intentionally no entry" note in `RequestPermissionResolvers.js` (a comment only, no resolver).
- Route `['/staff/copies', 'staffCopies']` in `HashRouteResolver.js`, placed before any broader `/staff` match. Add `staffCopies: [{ kind: 'staffOrSuperuser' }]` in `accessRouteConfig.js`, and `staffCopies: <StaffCopies />` in `AppHelper.jsx`.
- `adminItem('staff-copies', 'staff/copies', 'header.nav_staff_copies')` in `HeaderNavHelper.jsx`, after `staff-photos`.
- `UploadClient.linkUpload(uploadType, uploadId, token)`: `POST /uploads/link/<uploadType>/<uploadId>/submit` with `X-Upload-Token`, no body, returning the fetch `Response`. Follow `submitUpload` for the headers and the request helper.
- Specs: config paths, route resolution, access route, header item visibility (admin vs non-admin), `linkUpload` URL/method/header.

## Files to Change
- `frontend/assets/js/utils/requests/config/staffCopyConfig.js` — new.
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `staffCopy`.
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — note only.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — route.
- `frontend/assets/js/utils/access/accessRouteConfig.js` — access entry.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — page mapping.
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — admin item.
- `frontend/assets/js/client/UploadClient.js` — `linkUpload`.
- Matching specs under `frontend/specs/assets/js/...`.
