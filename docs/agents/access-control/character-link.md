# CharacterLink

**[Game resource](principles.md#resource-categories).** Character links are read through the
character detail endpoints (`links` array). Writable only nested inside the character
create/update payloads — no standalone `CharacterLink` endpoint.

## Fields
`id`, `text`, `url`, `link_type` — visible to anyone who can read the character detail (i.e.
anyone, both PC and NPC endpoints being public). `link_type` carries no access-control
implications (same enum as [Link](link.md)).

## Write access
No dedicated endpoint — links are written exclusively as a nested `links` array inside the
character payload, gated by the same permission as the character write itself:
- `PATCH /games/<slug>/pcs\|npcs/<id>/full.json` — **CharacterEdit**.
- `POST /games/<slug>/npcs.json` — **GameEdit**.
- The narrow player-facing PC/NPC `PATCH`s — see [Character](character.md#narrow-player-facing-patch).

## Write semantics
Each entry in the `links` array accepts `id` (optional), `text`, `url`, `link_type`, and a
transient `delete` flag. Per entry, applied after the character's own fields are saved:
- `delete: true` — deletes the link matching `id`. `id` is required; a delete with no `id` → 400.
- `id` present (no `delete`) — updates the link matching `id`; only present fields change.
- `id` absent — creates a new link owned by the target character; `url` is required for a create
  entry (not for an update).

On create (a brand-new character), any `id`/`delete` in the entries is ignored — a link is
unconditionally created per entry.

**Batch cap**: `MAX_LINKS` (50) entries per request, `400` when exceeded. **Atomicity**: the whole
batch runs in one transaction — any entry failing rolls back every entry already
applied/created in the same request. **Ownership check**: for update/delete, `id` must resolve to
a link already owned by the target character — an `id` for a link that doesn't exist, or belongs
to a different character, is rejected with `400`, never silently ignored and never allowed to
affect another character's link.
