# Export endpoint, scripts and privacy

**`docs/agents/specs/statistics-bug/export-endpoint.md`:**

- *Endpoint contract → Payload:* sessions gain `first_path`, `first_seen_logged`,
  `creation_reason`; visits gain `first_path`, `last_path` (*added by #1713*); `null` for rows
  from before the migration; definitions in [Tracking columns](tracking-columns.md#columns).
  Still never the session token or user details.
- *Caching and tracking:* after the sentence on device-authorization requests staying
  tracked, add that only their route pattern is stored, never the request `uuid` (see
  [Path values](tracking-columns.md#path-values)).
- *Device authorization:* mention it is #1708 (title already says so; fix the leftover "out of
  scope for #1699" wording only if needed for clarity).

**`docs/agents/specs/statistics-bug/scripts.md`:**

- Intro: add *#1712/#1713* to what the scripts depend on.
- *`emulate.py`*: the report includes, per session, `creation_reason`, `first_path`,
  `first_seen_logged`, and per visit `first_path` / `last_path`; each scenario declares the
  reasons it expects (IP change → `ip_changed`, host change → `domain_changed`, login
  mid-navigation → `login_rotation`, refresh without cookie → `no_cookie` per parallel
  request) and flags any mismatch.
- *`analyse.py`*: `creation_reason` is the primary classification signal where present, the
  heuristics are cross-checked against it and disagreements reported; `NULL` rows (before the
  release) fall back to the heuristics and are counted separately; the report adds counts per
  `creation_reason`, per `first_seen_logged`, and the top `first_path` values per reason; the
  production range starts after the #1701 release.
- *Cross-validation:* `analyse.py` must also recover each scenario's expected reasons.

**`docs/agents/specs/statistics-bug/privacy.md`:**

- New section `## Path columns`: no token or secret is ever stored — guaranteed by storing
  route patterns (no URL parameters, no query string; the device-authorization `uuid` is the
  motivating case); the columns stay staff-only (export and visit list); reports and committed
  findings show paths only aggregated (counts); any raw path that appears elsewhere (e.g.
  script logs) has ids and slugs masked (e.g. `/games/<slug>/…`).

## Files to Change

- `docs/agents/specs/statistics-bug/export-endpoint.md` — payload fields, tracked-route note.
- `docs/agents/specs/statistics-bug/scripts.md` — emulation expectations, analysis signal and
  report.
- `docs/agents/specs/statistics-bug/privacy.md` — *Path columns* section.
