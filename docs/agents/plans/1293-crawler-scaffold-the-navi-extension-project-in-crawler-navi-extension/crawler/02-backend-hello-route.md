# Backend hello route

One `GET` route proving the backend extension mechanism, plus its Jasmine
spec. No transform — `src/backend/*.js` is copied verbatim into `dist/` by
step 01's `build` script.

## Files to Change

- `crawler/navi-extension/src/backend/hello.js` — new. Default-exports an
  array with one `{ method: 'GET', path: '/ext/loot/hello.json', handler }`
  descriptor. `handler` extends `RequestHandler` (imported from
  `navi-hey/extension`, exactly as `extending-navi.md`'s
  `OrdersSummaryHandler` example does) and its `handle()` calls
  `this.response.json({ extension: 'navi-loot-extension', status: 'ok' })`
  synchronously (`GET` handlers run sync, per the doc).
- `crawler/navi-extension/tests/backend/hello_spec.js` — new. Follows
  `extending-navi.md`'s "Testing your extension" backend spec pattern
  exactly: import the route array from `../../src/backend/hello.js`, assert
  `method`/`path` on the one exported route, then instantiate the handler
  with a fake `req`/`res` (`res.json` capturing the payload) and assert on
  the captured body's `extension`/`status` fields.
