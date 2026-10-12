# Write the feature doc

Create `docs/agents/game-content-copy.md`: the lasting, as-implemented description of the
staff game content copy feature (epic #1550). Sources are the spec index
`docs/agents/specs/game-content-copy.md` and the global spec pages `page.md`, `copy-flow.md`,
`hard-links.md` and `permissions.md`, each checked against the merged code.

Suggested outline:

- Intro and "Related docs": `access-control/staff-copy.md` (endpoints),
  `access-control/upload.md` (copy-origin uploads), `architecture/proxy.md#link-handler`,
  and the per-tab pages.
- `## Page`: the Admin menu entry, route, source/target selectors and URL state, tabs, source
  list, per-entity and per-file progress, re-copy confirmation, pending/failed links list and
  retry. Also the frontend structure (`components/resources/staff_copy/`).
- `## Copy flow`: one request per entity in one DB transaction, `copied_from`, same-game
  references, no character links or history, clearing characters' available lists (#1565),
  name clashes, `hidden`, cover photo, edge cases.
- `## Hard links`: storage roots, the `Upload` copy origin (start returning `source_path`,
  finalize through `CopyLinkFinalizer`, `failed` + `error`, renew), the pending-links query,
  the independence of copies, and backward compatibility. Keep the proxy internals short and
  link to `architecture/proxy.md`.
- `## Permissions`: the staff gate (backend and frontend), the cross-game scope as a named
  Staff exception (link `product/entities/ownership-and-roles.md`), and security notes.
- `## Cache` (**required anchor**): `X-Skip-Cache` on every endpoint. Copy and link finalize
  send `X-Cache-Clear` paths, which the `staff_copies` proxy rule clears on **every** domain
  (#1570, #1580). Per-tab path lists live in each tab page's `## Cache`.
- `## Out of scope`: content never copied (character-attached rows,
  `GameTreasure`/`Treasure`, `GamePhoto`, `GameLink`, `Task`, `Poll`, `GameSession`, `Player`).
- `## Tabs`: one row per tab (label, model, page link).

Register it in `docs/agents/summary.md`, next to the "Access Statistics" entry, with a
one-paragraph summary in the same style.

## Files to Change

- `docs/agents/game-content-copy.md`: new feature doc.
- `docs/agents/summary.md`: new entry.
