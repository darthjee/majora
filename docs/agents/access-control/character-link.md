# CharacterLink

Character links are read through the character detail endpoints (`links` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`). Links are writable,
nested inside the character create/update payloads — there is no standalone `CharacterLink`
create/update/delete endpoint.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can read the
character detail (i.e. anyone, since both PC and NPC detail endpoints are publicly accessible).
`link_type` carries no access-control implications (same enum as [Link](link.md) above).

**Write access:** no dedicated `CharacterLink` endpoint — links are written exclusively as a
nested `links` array inside the character payload, gated by the same permission as the character
write itself:

- `PATCH /games/<slug>/pcs/<id>/full.json`, `PATCH /games/<slug>/npcs/<id>/full.json` — via
  `CharacterUpdateSerializer`'s `links` field, **CharacterEdit**.
- `POST /games/<slug>/npcs.json` — via `CharacterCreateSerializer`'s `links` field, **GameEdit**.

**Write semantics** (`CharacterLinkWriteSerializer` + `CharacterLinksSync`, in
`source/games/serializers/character_link_write.py`): each entry in the `links` array accepts
`id` (optional int), `text`, `url`, `link_type`, and a transient `delete` flag (not a model
field). Routing per entry, applied server-side after the character's own fields are saved:
- `delete: true` — deletes the existing link matching `id`. `id` is required whenever
  `delete: true`; a delete entry with no `id` → 400.
- `id` present (no `delete`) — updates the existing link matching `id`; only the fields present
  in the entry are changed (blank fields keep their existing value).
- `id` absent — creates a new `CharacterLink` owned by the target character. `url` is required
  for any new entry that isn't a delete; missing `url` on a create entry → 400. An update entry
  does not require `url`.

On create (`CharacterLinksSync.create_all()`), any `id`/`delete` in the entries is ignored and a
link is unconditionally created per entry — there is no existing character yet to update or
delete against.

**Batch size cap:** the `links` array is capped at `MAX_LINKS` (50) entries per request,
rejected with 400 when exceeded — each entry drives at least one synchronous DB query.

**Atomicity:** `CharacterLinksSync.apply()` and `.create_all()` each run their per-entry loop
inside `transaction.atomic()` — if any entry in the batch fails, every entry already
applied/created earlier in the same request is rolled back.

**Ownership check:** for update and delete, `id` must resolve to a `CharacterLink` already owned
by the target character (`character.links.filter(id=link_id)`) — an `id` for a link that doesn't
exist, or belongs to a different character, is rejected with 400
(`{"errors": {"links": ["Unknown link id <id>."]}}`, via the `save_or_error()` helper in
`source/games/views/common.py`), never silently ignored and never allowed to affect another
character's link.
