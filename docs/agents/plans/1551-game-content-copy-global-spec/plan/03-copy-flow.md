# Write `copy-flow.md`

Describe the DB-copy phase and the shared copy rules, from the issue's `copy-flow.md`, API
baseline (backend copy endpoints) and edge-case sections.

- One `POST staff/copies/<type>/<id>.json` `{target}` per entity, one transaction; response `201`
  with the new id and pending links `[{upload_id, upload_type, token}]`, never paths; `404`
  source gone, `422` faction name clash.
- Associated rows created with `ready=false` (hidden by every listing); source uploads that are
  themselves `ready=false` are skipped; one copy-origin `Upload` per copied photo/file.
- `copied_from` FK (`SET_NULL`) on each copyable model; `copied_to_target` derived from it.
- Rules: name clashes allowed except factions; `hidden` kept; cover FK null until its photo is
  finalized.
- Edge cases: source gone (404), target game / copied entity deleted with pending links
  (cascade via `GenericRelation`, later link → 404).
- The API table for the backend copy/list endpoints (`staff/copies.json`, `games.json`,
  `<type>.json`, `<type>/<id>.json`).

## Files to Change

- `docs/agents/specs/game-content-copy/copy-flow.md` — new.
