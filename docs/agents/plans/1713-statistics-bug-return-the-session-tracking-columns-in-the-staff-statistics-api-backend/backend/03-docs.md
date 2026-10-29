# Docs

Document the new payload fields. Permanent docs never add links to the specs (keep existing
links as they are).

- `docs/agents/statistics.md`:
  - **Visit list**: add `first_path`, `last_path`, `session_first_path`,
    `session_creation_reason`, `session_first_seen_logged` to the row field list, pointing to the
    existing route-pattern and creation-reason sections of the same doc; `null` for rows from
    before the tracking columns;
  - **Export endpoint**: mention the session and visit tracking fields.
- `docs/agents/access-control/staff-statistics.md`: add the fields to the export payload and the
  visit-list payload shapes; restate that paths are route patterns and the token is never
  exposed.
- `docs/agents/specs/statistics-bug/export-endpoint.md`: drop the "*added by #1713*" marker on
  the tracking fields bullet (content unchanged).

## Files to Change

- `docs/agents/statistics.md` — visit list and export payloads
- `docs/agents/access-control/staff-statistics.md` — payload shapes
- `docs/agents/specs/statistics-bug/export-endpoint.md` — drop the marker
