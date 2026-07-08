# Plan: Add create/edit links API

Issue: [392-add-create-edit-links-api.md](../issues/392-add-create-edit-links-api.md)

## Overview

Add a nested, writable `links` payload to the character create/update flow (backend), and
a new "Edit links" modal on the PC/NPC edit pages (frontend) that lets a user add, edit, and
mark links for deletion locally before committing the change together with the rest of the
character form. New UI text is added to both translation files.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Links payload shape (request, sent by frontend, consumed by backend)

Included as a `links` array field inside the existing character payloads:
- `PATCH /games/<game_slug>/pcs/<id>.json` and `PATCH /games/<game_slug>/npcs/<id>.json`
  (existing update endpoints, handled by `character_detail` / `CharacterUpdateSerializer`)
- `POST /games/<game_slug>/npcs.json` (existing NPC create endpoint, handled by
  `_create_npc` / `CharacterCreateSerializer` — there is currently no PC create endpoint,
  so `links` only needs to be supported on create for NPCs)

Each entry in `links`:

```json
{
  "id": 12,            // omitted/null for a non-persisted (new) link
  "text": "Loot table",
  "url": "https://example.com/loot",
  "link_type": "lootstudio",  // optional, "" allowed
  "delete": false      // when true, the link (must have an id) is deleted
}
```

Backend processing rules (applied server-side, inside the serializer's `update`/`create`):
- entries with `delete: true` (must include `id`) → delete the `CharacterLink`
- entries without `id` (and not `delete: true`) → create a new `CharacterLink` for the character
- entries with `id` and no `delete: true` → update the existing `CharacterLink`'s `text`/`url`/`link_type`
- `url` is required (per `CharacterLink.url` being a non-blank `URLField`) for created/updated
  entries; `link_type` is optional (blank allowed, as today); `text` is optional — the frontend
  is responsible for defaulting blank `text` to the `url` before submitting (per the issue's
  validation rule), so the backend does not need its own text-defaulting logic.
- the response continues to be `CharacterDetailSerializer`, whose existing read-only `links`
  field (`CharacterLinkSerializer`) reflects the persisted state after the write — no serializer
  contract change on the read side.

### Frontend response shape it can rely on

No response shape changes: the `links` array returned by `CharacterDetailSerializer` (`id`,
`text`, `url`, `link_type`) is unchanged and continues to be what seeds the modal's local state.

## Notes

- No new API endpoint is introduced — existing character create/update endpoints gain a new
  optional field. Per the architect's data-access review policy this still warrants a
  `data-access` review after backend finishes (new/changed serializer write behavior), and a
  `security` review (new user input path — arbitrary `url`/`text`/`link_type` values written to
  the database). Both are dispatched by the architect after backend implementation, not part of
  the per-agent plans below.
- `docs/agents/access-control.md` does not need a new entry (no new model/endpoint), but should
  be checked by the `data-access` agent for accuracy regarding character link writes.
