# GamePhoto

**[Game resource](principles.md#resource-categories).** Game photos are readable through the game
detail endpoint (`photos` array) and through a dedicated photo index endpoint.

## Photo index endpoint
| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/photos.json` | GET | **AllowAny** | Paginated `{id, path}` for photos where `ready=True` |

## Fields
`id`, `path` — see [Photo path fields](common-rules.md#photo-path-fields); `ready` is internal,
never serialized. Once a `GamePhoto` becomes a game's `cover_photo`, it's also exposed via
`Game.cover_photo_path` — both exposures apply simultaneously.

## Write access
- `POST /games/<slug>/photo_upload.json` — **GameEdit**; creates a `GamePhoto` with `ready=False`
  as part of the [upload init flow](upload.md#endpoint-summary). Not visible in the game detail
  until finalised.
- All other write operations: superuser only (Django admin).

`Game` has no privacy/hidden concept, so this endpoint has no additional visibility gate.
