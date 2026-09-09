# Specs

Mirror `staff_dashboard`'s spec conventions exactly: one spec file per
component/helper, controllers get one spec file per public method inside a
folder named after the controller class, plus a shared `support.js`.

## Files to Change

- `frontend/specs/assets/js/client/CrawlerClientSpec.js` — new spec for
  `fetchEmissions` (with and without `lastId`), mirroring existing client
  specs (e.g. `GameSessionClientSpec.js` if present, otherwise any
  `BaseClient` subclass spec).
- `frontend/specs/assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController/support.js`
  — shared mocks/setup (mock `CrawlerClient`, `AccessStore`, `AuthStorage`).
- `frontend/specs/assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController/buildEffectSpec.js`
  — access-gate redirect/allow behavior (mirrors
  `StaffDashboardController/buildEffectSpec.js`).
- `frontend/specs/assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController/startFeedSpec.js`
  — drain-then-poll behavior: multiple full pages drain in sequence,
  stops draining on a short page, switches to interval polling
  (`jasmine.clock()` for the 10s interval), appends new records without
  duplicating already-seen ones.
- `frontend/specs/assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController/stopFeedSpec.js`
  — interval is cleared and safe to call twice.
- `frontend/specs/assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController/selectEmissionSpec.js`
  — calls the injected setter with the given id.
- `frontend/specs/assets/js/components/resources/crawler/pages/helpers/StaffCrawlerHelperSpec.js`
  — loading/error/render states, selected-row highlighting, right-column
  JSON pretty-print output.
- `frontend/specs/assets/js/components/resources/crawler/pages/StaffCrawlerSpec.js`
  — mounts the page, exercises the auto-scroll-pause behavior (simulate
  `scrollTop`/`scrollHeight`/`clientHeight` on the mocked feed container:
  scrolled-to-bottom triggers auto-scroll on new emissions, scrolled-up does
  not).
