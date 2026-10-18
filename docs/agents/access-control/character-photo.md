# CharacterPhoto

**[Game resource](principles.md#resource-categories).** Character photos are readable through the
character detail endpoints (`photos` array) and through dedicated photo index endpoints (PC, NPC).
`CharacterPhoto` fully replaces the legacy `Photo` model, serving both the character's photo
gallery and, via `Character.profile_photo`, its profile picture.

## Photo index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/photos.json` | GET | **AllowAny** | Paginated `{id, path}`, `ready=True` only |
| `/games/<slug>/npcs/<id>/photos.json` | GET | **AllowAny**; `404` when the NPC is hidden (see the hidden-NPC gate below) | Same as above |
| `/games/<slug>/npcs/<id>/photos/all.json` | GET | **CharacterEdit** (see [Character](character.md#restricted-access-fulljsonalljson)), checked before the hidden state is consulted | Same as above, served even when the NPC is hidden. Always `X-Skip-Cache: true` |

## Fields

`id`, `path` — visible to anyone who can read the endpoint (i.e. anyone, since NPC endpoints are
public for non-hidden NPCs). `ready` is internal, never serialized. As with `GamePhoto`, `path` is
also exposed indirectly via `Character.profile_photo_path` — both apply simultaneously.

## Hidden-NPC gate

If `character.hidden` is `True`, the plain `game_npc_photos` route returns `404` (with
`X-Skip-Cache: true`) for **every** caller, editors included: a plain (AllowAny) route never varies
by role. Editors (superuser, the game's GameMaster) read a hidden NPC's photos through
`npcs/<id>/photos/all.json` instead. The editor-aware variant of the gate (404 only to a
requester who cannot edit the character) remains only on write routes and the restricted
siblings. PCs have no `hidden` concept, so `game_pc_photos` has no equivalent gate and there is
no PC `photos/all.json`. The same gate pattern is reused by
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
