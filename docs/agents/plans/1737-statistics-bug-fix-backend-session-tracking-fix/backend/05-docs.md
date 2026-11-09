# Docs

Update `docs/agents/statistics.md`:

- **Session tracking / reuse:** a valid cookie for the same domain is reused whatever the IP;
  `Session.ip` is the last seen IP; `ip_changed` is no longer produced for a valid cookie (kept
  for existing rows).
- **`Visit`:** document `first_ip` / `last_ip` (`NULL` for visits before #1737) next to
  `first_path` / `last_path`.
- **Untracked requests:** exact `UNTRACKED_PATHS`, a valid skip header, or no matching route
  (unresolved paths create nothing and set no cookie). Remove `unresolved` as a written value
  from "Route pattern values" (it stays readable on old rows).
- **User attachment:** the middleware attaches in place like the login view; same-user reuse;
  a different user rotates; the shared-device trade-off.
- **Counting caveats:** an anonymous visitor whose IP changes is now one visitor.
- **Tracking race:** update the "User attachment" bullet (a vanished session still rotates).
- **API conventions / export:** the new `first_ip` / `last_ip` fields; `ip` on visit rows.

## Files to Change

- `docs/agents/statistics.md` — the sections above.
- `docs/agents/access-control/staff-statistics.md` — list the new visit fields, if it lists
  fields.
