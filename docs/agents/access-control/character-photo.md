# CharacterPhoto

**[Game resource](principles.md#resource-categories).** Character photos are readable through the
character detail endpoints (`photos` array) and through dedicated photo index endpoints (PC, NPC).
`CharacterPhoto` fully replaces the legacy `Photo` model, serving both the character's photo
gallery and, via `Character.profile_photo`, its profile picture.

## Photo index endpoints
| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/photos.json` | GET | **AllowAny** | Paginated `{id, path}`, `ready=True` only |
| `/games/<slug>/npcs/<id>/photos.json` | GET | **AllowAny**, but see the hidden-NPC gate below | Same as above |

## Fields
`id`, `path` — visible to anyone who can read the endpoint (i.e. anyone, since NPC endpoints are
public for non-hidden NPCs). `ready` is internal, never serialized. As with `GamePhoto`, `path` is
also exposed indirectly via `Character.profile_photo_path` — both apply simultaneously.

## Hidden-NPC gate
If `character.hidden` is `True` and the requester cannot edit the character, `game_npc_photos`
raises `404` instead of returning the photo list — visible only to the character's player, that
game's GameMaster, or a superuser. PCs have no `hidden` concept, so `game_pc_photos` has no
equivalent gate. The same gate pattern is reused by
[CharacterItem](character-item.md)/[CharacterDocument](character-document.md)/[CharacterTreasure](character-treasure.md)'s
own NPC index endpoints.

## Write access
- `POST /games/<slug>/pcs\|npcs/<id>/photo_upload.json` — see [Upload](upload.md#endpoint-summary);
  creates a `CharacterPhoto` with `ready=False`.
- `PATCH /games/<slug>/pcs\|npcs/<id>/photos/<photo_id>/set.json` ("set as profile photo") —
  **CharacterPhotoUpload**: superuser, any GameMaster of the game, the PC's own owning player, any
  player of the game, or any global staff account — matches the upload endpoints, so anyone who
  may upload a photo may also set one as profile photo. Accepts `{"roles": ["profile"]}`.
- All other write operations: superuser only (Django admin).
