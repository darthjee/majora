# GamePhoto

Game photos are readable through the game detail endpoint (`photos` array in
`GameDetailSerializer`) and through a dedicated photo index endpoint.

**Exposed fields** (read): `id`, `path` — visible to anyone who can read the game detail or the
photo index endpoint below. The `ready` field is internal and never serialised. `path` is
serialised directly by `GamePhotoSerializer` (`fields = ['id', 'path']`) and, once a `GamePhoto`
becomes a game's `cover_photo`, also indirectly via `Game.cover_photo_path` — both exposures
apply simultaneously.

**Write access:**
- `POST /games/<slug>/photo_upload.json` — **GameEdit**. Creates a `GamePhoto` row with
  `ready=False` as part of the upload initialisation flow (see [Game photo upload init
  endpoint](upload.md#game-photo-upload-init-endpoint) below). Not visible in the game detail until the upload is finalised and `ready` is
  set to `True`.
- All other write operations: superuser only (via Django admin, out of scope).

## Photo index endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/photos.json` | GET | **AllowAny** | Paginated list of `GamePhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |

Unknown `game_slug` → 404. Not-ready photos (still mid-upload) are excluded. `Game` has no
privacy/hidden concept, so this endpoint has no additional visibility gate.
