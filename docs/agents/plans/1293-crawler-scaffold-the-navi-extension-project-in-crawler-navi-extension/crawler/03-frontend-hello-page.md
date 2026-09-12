# Frontend hello page

One page that fetches step 02's route and renders its response, plus the
`entry.js` descriptor Navi discovers, plus a frontend spec.

## Files to Change

- `crawler/navi-extension/src/frontend/HelloPage.jsx` — new. A function
  component that, on mount (`useEffect`), `fetch('/ext/loot/hello.json')`s
  and renders the returned `status` (loading/error states optional but kept
  trivial — mirror `extending-navi.md`'s `OrdersPage` shape: a `Loading…`
  state, an error state, and the success render).
- `crawler/navi-extension/src/frontend/entry.js` — new. Default-exports `[{
  path: '/ext/loot/hello', text: 'Loot Hello', component: HelloPage }]`.
- `crawler/navi-extension/tests/frontend/hello_page_spec.jsx` — new. Follows
  `extending-navi.md`'s "Testing your extension" frontend spec pattern:
  `useContainer()` from `navi-hey/testing/dom.js`, `mockFetchSuccess` from
  `navi-hey/testing/fetch.js` stubbing the hello route's response, assert the
  `entry.js` descriptor's `path`/`text`, then render `HelloPage` via
  `state.root.render` inside `act(async () => ...)` and assert the rendered
  text reflects the mocked response.
