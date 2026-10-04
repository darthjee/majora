# Align the shared pages and the hub

Keep the shared pages consistent now that a second tab owns a `sort` param:

- `shared-infrastructure.md`: where it says "the Users tab's `sort`" (tab nav note,
  `FILTER_KEYS` allowlist note, tab-specific params paragraph listing `invalid_sort`),
  mention the Visit list's `sort` too, linking `visit-list.md#ordering`. Keep `invalid_sort`
  as a single shared code. If `users.md` defines the `sort` validator as a Users-only helper,
  note in `visit-list.md` (not by rewriting `users.md`) that the implementation should share
  it (e.g. a helper in `staff/views/_staff_statistics_shared.py` taking the allowed keys).
- `access-and-security.md`: if it enumerates what tabs expose, add that the Visit list
  exposes raw IPs and statistics session ids.
- Hub `docs/agents/specs/access-statistics.md`: flip the Visit list page status from `stub`
  to `specced` (#1489).

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — `sort` mentions now cover the Visit list.
- `docs/agents/specs/access-statistics/access-and-security.md` — only if it lists per-tab exposure.
- `docs/agents/specs/access-statistics.md` — Visit list status `specced`.
