# Link

**[Game resource](principles.md#resource-categories).** Links are read through the game detail
endpoint (`links` array). Writable only nested inside the game update payload (issue #891) — no
standalone `Link` endpoint.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can read the
game detail (i.e. anyone). `link_type` is a non-sensitive display-icon enum (`''` or
`lootstudio`) driving which icon the frontend renders next to the link; it carries no
access-control implications.

## Write access

No dedicated endpoint — links are written exclusively as a nested `links` array inside
`PATCH /games/<slug>.json`, gated by the same permission as the rest of that payload's fields:
- Full field set (`name`+`description`+`links`) — **GameEdit**.
- `description`+`links` only, no `name` — **GameRegularEdit** (see
  [Game](game.md#write-fields)/[common-rules](common-rules.md)).

## Write semantics

Same shape as [CharacterLink](character-link.md#write-semantics): each entry accepts `id`
(optional), `text`, `url`, `link_type`, and a transient `delete` flag, applied after the game's
own scalar fields are saved.
- `delete: true` — deletes the link matching `id`. `id` is required; a delete with no `id` → 400.
- `id` present (no `delete`) — updates the link matching `id`; only present fields change.
- `id` absent — creates a new link owned by the target game; `url` is required for a create entry
  (not for an update).

**Batch cap**: `MAX_LINKS` (50) entries per request, `400` when exceeded. **Atomicity**: the whole
batch runs in one transaction — any entry failing rolls back every entry already
applied/created in the same request. **Ownership check**: for update/delete, `id` must resolve to
a link already owned by the target game — an `id` for a link that doesn't exist, or belongs to a
different game, is rejected with `400`, never silently ignored and never allowed to affect another
game's link.
