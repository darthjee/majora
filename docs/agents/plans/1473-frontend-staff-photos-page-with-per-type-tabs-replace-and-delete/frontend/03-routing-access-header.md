# Routing, access and header nav

Wire the new route. The page component itself is created in step 06; to keep each commit building, you may create a minimal `StaffPhotos.jsx` stub here and flesh it out in step 06, or import it in step 06 — either is fine as long as the final state is consistent.

- `HashRouteResolver.js`: add `['/staff/photos', 'staffPhotos']` in the staff block of `ROUTES`.
- `accessRouteConfig.js`: `staffPhotos: [{ kind: 'staffOrSuperuser' }]`.
- `AppHelper.jsx`: import `StaffPhotos` and map `staffPhotos: <StaffPhotos />` in `PAGES`.
- `HeaderNavHelper.jsx`: `adminItem('staff-photos', 'staff/photos', 'header.nav_staff_photos')` next to the other staff entries.
- Extend the specs: `HashRouteResolverSpec/staffRoutesSpec.js`, `accessRouteConfigSpec.js`, `AppHelperSpec/staffAccountRoutesSpec.js`, `HeaderHelper/navLinksSpec.js` (admin dropdown).

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/utils/access/accessRouteConfig.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`
- matching specs under `frontend/specs/assets/js/...`
