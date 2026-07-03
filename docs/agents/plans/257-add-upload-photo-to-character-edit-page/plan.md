# Plan: Add upload photo to character edit page

Issue: [257-add-upload-photo-to-character-edit-page.md](../../issues/257-add-upload-photo-to-character-edit-page.md)

## Overview

Mirror the game edit page's photo upload flow (upload button opening `PhotoUploadModal`,
backed by `UploadClient`) on the shared PC/NPC character edit page. The backend upload
endpoints (`/games/<slug>/pcs/<id>/photo_upload.json` and
`/games/<slug>/npcs/<id>/photo_upload.json`) already exist (added in #255), so this is a
frontend-only change plus the small translation-key addition it needs.

To reuse the existing upload plumbing for both games and characters, `UploadClient.initUpload`
and `PhotoUploadModal` are generalized to work against an arbitrary upload path instead of a
hard-coded game slug, so the same modal/client can POST to either the game or the character
upload endpoint.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend introduces one new translation key per character edit namespace, used exactly
like the existing `game_edit_page.upload_photo_button` key:

- `pc_edit_page.upload_photo_button`
- `npc_edit_page.upload_photo_button`

Both keys must be added to every locale file under `frontend/assets/i18n/` (currently
`en.yaml` and `pt.yaml`) so `npm run check_i18n` (key-parity check) keeps passing. The
frontend agent will reference these keys via `Translator.t(`${i18nNamespace}.upload_photo_button`)`
in `BaseCharacterEditHelper.jsx` (where `i18nNamespace` is `pc_edit_page` or `npc_edit_page`),
so the translator agent's keys must use that exact naming.
