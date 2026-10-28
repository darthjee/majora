# Request config entries

Register the two endpoints with `RequestStore` so the card never builds URLs by hand.

In `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`:

- add `const summary = { path: () => '/staff/statistics/summary.json', permission: null };` and
  `GET.summary: { regular: summary, private: summary }`;
- add `const clear = { path: () => '/staff/statistics.json', permission: null };` and a new
  top-level `DELETE: { clear: { regular: clear, private: clear } }` (same shape as
  `apiTokenConfig.js`'s `DELETE`);
- extend the doc comment. It should describe `GET.summary` (#1682), the dashboard card's
  unique-visitors count, and `DELETE.clear` (#1684), which wipes every visit and session and
  resets their IDs. It should note that the file now holds a non-`GET` method.

Add **no** entry to `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`. Both
entries fall back to `NO_PERMISSIONS`, like every other statistics endpoint.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — `GET.summary`,
  `DELETE.clear`, doc comment.
- The existing spec for this config, if any (look under
  `frontend/specs/assets/js/utils/requests/config/`) — cover the two new entries.
