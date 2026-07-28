# Plan: Fix permissions serializers

Issue: [884-fix-permissions-serializers.md](../../issues/884-fix-permissions-serializers.md)

## Overview

`CharacterDetailSerializer` currently embeds 5 requester-identity-dependent permission fields (`can_edit`, `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `can_delete_photo`), forcing every view that returns it to disable caching entirely. The fix moves those 4 missing fields (`can_edit` is already there) into the existing `CharacterPermissionsSerializer`/`.../permissions.json` endpoint, strips them from the detail/full serializers, removes the now-unneeded `X-Skip-Cache` forcing from the affected views, and updates the frontend's `CharacterAccessResolver` so UI features that read these fields keep working via the permissions endpoint instead of the detail response.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- `GET .../permissions.json` (existing route, `CharacterPermissionsSerializer`) gains 4 new boolean keys in its JSON response, alongside the existing `can_edit`, `can_create_item`, `can_upload_item_photo`:
  - `can_edit_money`
  - `can_exchange_treasure`
  - `can_set_profile_photo`
  - `can_delete_photo`
- These 4 keys are removed from the character detail/full JSON responses (`can_edit` stays removed too, since it already exists on the permissions endpoint) — frontend must stop reading them off the loaded `character` object directly and instead source them from `AccessStore.getCharacterPermissions(...)`, the same store already used for `can_edit`/`is_player`/`is_staff`.
- Real-identity requests to `permissions.json` (no `role` query param) return `X-Skip-Cache: true`; role-simulated requests (`?role=...`) return `X-Force-Public-Cache: true` — unchanged, existing behavior (`permissions_response()` in `backend/games/views/common.py`).
