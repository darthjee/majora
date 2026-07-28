# Plan: Add photo deletion

Issue: [721-add-photo-deletion.md](../issues/721-add-photo-deletion.md)

## Overview
Add a delete flow for PC/NPC photos, restricted to admin (superuser), staff, and DM — never the owning player. The flow mirrors the existing upload pattern: a two-step frontend submit (`PATCH {ready: false}` then `DELETE`), three new backend endpoints, and a new proxy orchestration handler (modeled on `UploadHandler`) that checks deletability, removes the file from disk, then calls the backend `DELETE`.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Backend endpoints (PC and NPC — consumed by proxy and frontend)

| Endpoint | URL name | Permission | Notes |
|---|---|---|---|
| `GET .../{pcs,npcs}/:id/photos/:photo_id/deletable.json` | `game-{pc,npc}-photo-deletable` | `CharacterPhotoDeletePermission` (new) | Ignores hidden state (game-access-if-dm still checked). 404 if photo not found; 422 if `ready` is `True`; else `200 {deletable: true, path: <photo.path>}`. Always `X-Skip-Cache: true`. Consumed only by the proxy handler, not called directly by the frontend. |
| `PATCH .../{pcs,npcs}/:id/photos/:photo_id.json` body `{ready: false}` | `game-{pc,npc}-photo-detail` | `CharacterPhotoDeletePermission` (new) | Sets `photo.ready = False` only. If `character.profile_photo_id == photo.id`, clears it. `X-Skip-Cache: true`. Same route as DELETE below (method-dispatched, one view — same shape as the existing `.json`/`full.json` GET+PATCH detail view). |
| `DELETE .../{pcs,npcs}/:id/photos/:photo_id.json` | `game-{pc,npc}-photo-detail` | `CharacterPhotoDeletePermission` (new) | 422 if `photo.ready` is `True`. Deletes the row (`profile_photo` auto-nulls via `on_delete=SET_NULL` if the preceding PATCH somehow didn't already clear it). `X-Skip-Cache: true`. No cache-cleanup entry needed — a deletable photo is always `ready: false`, already excluded from every cached collection listing. |

### New permission — `CharacterPhotoDeletePermission`

Deliberately narrower than `CharacterPhotoUploadPermission` (which also allows any player of the game and the owning player). Reuses `Game.can_be_edited_by`, which already resolves to exactly "superuser or DM of this game":

```python
class CharacterPhotoDeletePermission(_EditPermission):
    """Allow only staff, a DM of the character's game, or a superuser to delete a photo."""

    @classmethod
    def check(cls, request, character):
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.game.can_be_edited_by(user)
```

`character.game.can_be_edited_by(user)` (`backend/games/models/game/game.py:49-58`) is already exactly `is_superuser or has_player(user, is_dm=True)` — combined with `user.is_staff`, this yields precisely admin/dm/staff, excluding the owning player. This is the first app-level delete endpoint and the first delete gate to include `dm` (confirmed against product.md by the product-owner agent as consistent with the "delete is stricter than edit" precedent already set by Treasure/Game).

### Frontend-visible capability flag

`CharacterDetailSerializer` (`backend/games/serializers/characters/character_detail.py`) gets a new field, exactly mirroring `can_set_profile_photo`:

```python
can_delete_photo = serializers.SerializerMethodField()
...
def get_can_delete_photo(self, obj):
    request = self.context.get('request')
    user = request.user if request else None
    return CharacterPhotoDeletePermission.is_allowed(user, obj)
```

The frontend already threads `character.can_set_profile_photo` straight into `PhotoCard`'s `canSetProfilePhoto` prop with no extra plumbing (see `frontend.md`) — `can_delete_photo` follows the identical path, no `AccessStore` changes needed.

### Proxy → backend orchestration

New `DeleteHandler` (mirrors `UploadHandler`), triggered only for `DELETE .../{pcs,npcs}/:id/photos/:photo_id.json` (GET and PATCH keep riding the existing generic `backend.php` passthrough — no proxy change needed for those two verbs):

1. `GET .../photos/:photo_id/deletable.json` — on non-200, pass the backend's status/body straight through as the handler's response (404/422).
2. Delete the file at the returned `path` (guarded by `SecurePhotoStorage`, new method needed — see `proxy.md`).
3. `DELETE .../photos/:photo_id.json` against the backend — pass its response straight through.

### Frontend submit flow

Two-step, mirroring `PhotoUploadSaga`: `PATCH {ready: false}` then `DELETE`, both against `/games/:game_slug/{pcs,npcs}/:id/photos/:photo_id.json` (same URL, different verb) via a new `photoDelete` quantity-type entry in `pcConfig.js`/`npcConfig.js`, gated by the new `can_delete_photo` flag. See `frontend.md` for the exact client/config wiring (this requires adding `DELETE` support to `RequestMutationClient`/`BaseClient`, which doesn't exist yet).

### i18n keys (frontend references, translator adds the values — see `translator.md`)

- `delete_photo_confirm_modal.title`, `.body`, `.confirm`, `.cancel`
- `photo_card.delete_photo` (button tooltip/aria-label)
