# CharacterPhoto

Character photos are readable through the character detail endpoints (`photos` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`) and through
dedicated photo index endpoints (one for PCs, one for NPCs). `CharacterPhoto` fully replaces the
legacy `Photo` model (which only had a bare `url` field and no upload/ready lifecycle) — serving
both the character's photo gallery (`character.photos`) and, via `Character.profile_photo`, its
profile picture.

**Exposed fields** (read): `id`, `path` — both visible to anyone who can read the character
detail or photo index endpoint (i.e. anyone, since PC endpoints are publicly accessible, and NPC
endpoints are publicly accessible for non-hidden NPCs — see "Photo index endpoints" below). The
`ready` field is internal and never serialised. As with `GamePhoto`, `path` is exposed both
directly by `CharacterPhotoSerializer` and indirectly via `Character.profile_photo_path` — both
apply simultaneously.

**Write access:**
- `POST /games/<slug>/pcs/<id>/photo_upload.json`, `POST /games/<slug>/npcs/<id>/photo_upload.json`
  — see [Character photo upload init endpoints](upload.md#character-photo-upload-init-endpoints) above. Creates a `CharacterPhoto` row with
  `ready=False`.
- All other write operations: superuser only (via Django admin, out of scope).

## Photo index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/photos.json` | GET | **AllowAny** | Paginated list of `CharacterPhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |
| `/games/<slug>/npcs/<id>/photos.json` | GET | **AllowAny**, but see hidden-NPC gate below | Same as above |

Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to `game_slug`,
or is the wrong PC/NPC type) → 404. Not-ready photos are excluded.

**Hidden-NPC gate** (`game_npc_photos` only): if `character.hidden` is `True` and the requesting
user cannot edit the character (`not character.can_be_edited_by(request.user)`), the endpoint
raises `Http404` instead of returning the photo list — visible only to the character's player, a
GameMaster of that game, or a superuser. `PC` characters have no `hidden` concept, so
`game_pc_photos` has no equivalent gate. The same gate pattern is reused by the [treasure index
endpoint](character-treasure.md#treasure-index-endpoints) below.
