# Plan: Add photo upload on `CharacterItem` Creation page

Issue: [817-add-photo-upload-on--characteritem--creation-page.md](../issues/817-add-photo-upload-on--characteritem--creation-page.md)

## Overview

Add a left-side photo slot to the shared `CharacterItemNew` creation form (used by both PC
and NPC item creation), letting the user pick a photo before submit via the existing
`PhotoUploadModal` in `deferred` mode — the same mechanism `GameNpcNew` already uses. On
submit, the `CharacterItem` is created first (its response already includes the underlying
`GameItem`'s id, `game_item_id`), then the picked photo is uploaded against that id through
the existing `POST /games/:game_slug/items/:id/photo_upload` endpoint. The create-then-upload
saga currently inlined in `GameNpcNewController` is extracted into a shared `PhotoUploadSaga`
helper reused by both controllers. On upload failure, the page stays put (the item already
exists) and shows an inline retry/skip alert, mirroring `NpcNewPhotoUploadFailedAlert` but
without a redirect. No backend changes are needed.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

Three new i18n keys under the existing `character_item_new_page` namespace, consumed by a new
`ItemNewPhotoUploadFailedAlert` component (frontend) and produced in both locale files
(translator), mirroring the existing `game_npc_new_page` equivalents:

- `character_item_new_page.photo_upload_failed`
- `character_item_new_page.retry_photo_upload`
- `character_item_new_page.skip_photo_upload`

No other cross-agent surface is touched — the photo-upload HTTP endpoint and the
`game_item_id` field on the creation response already exist (added by issue #750/#757), so
there is no backend contract to define here.
