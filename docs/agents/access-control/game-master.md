# GameMaster

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/game-masters.json`) | **AllowAny** |
| Create (`POST /games/<slug>/game-masters.json`) | Any authenticated user (self-assignment only; duplicates rejected with 400) |
| Delete (`DELETE /games/<slug>/game-masters/<id>.json`) | The GameMaster themselves, or a superuser; others → 403 |

**Exposed fields** (read): `id`, `user` reference (serialized by `GameMasterSerializer`).
