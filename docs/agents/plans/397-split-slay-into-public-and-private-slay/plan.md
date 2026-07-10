# Plan: Split slain into public and private slain

Issue: [397-split-slay-into-public-and-private-slay.md](../../issues/397-split-slay-into-public-and-private-slay.md)

## Overview

Add a `public_slain` field to `Character`, mirroring the existing `allegiance`/`public_allegiance`
split: `slain` becomes the DM-only real value, `public_slain` is the value shown to players.
Public-facing serializers/filters expose `public_slain` under the `slain` key (aliasing, same
trick used for `public_allegiance` → `allegiance`); DM-facing serializers/filters expose both
real fields. The DM-only slain-toggle endpoint accepts partial updates to either field, and the
NPC card/detail overlay gains a second toggle button so the DM can set the real and public state
independently, with filled icons (`bi-skull-fill`/`bi-heart-fill`) for the real button and
outline icons (`bi-skull`/`bi-heart`) for the public one.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API — `PATCH /games/:game_slug/npcs/:id/slain.json`

- Stays gated by the existing `CharacterEditPermission` (already resolves to DM/superuser-only
  in practice for NPCs, since NPCs have no player by convention — no permission logic changes).
- Request body accepts `slain` and/or `public_slain` (both optional booleans, but **at least one
  required**) — each present key updates only that model field, the other is left untouched.
- Response body always returns both current values: `{"slain": bool, "public_slain": bool}`.

### Serializer field exposure (mirrors `allegiance`/`public_allegiance`)

- Public-facing serializers (`CharacterListSerializer`, `CharacterDetailSerializer`, used by
  `GET npcs.json` / `GET npcs/<id>.json` / `GET pcs.json` / `GET pcs/<id>.json`): the JSON key
  `slain` is sourced from the `public_slain` model field. The real `slain` model field is never
  exposed on these endpoints.
- DM-facing serializers (`CharacterFullListSerializer`, `CharacterFullSerializer`, used by
  `GET npcs/all.json` / `GET pcs/<id>/full.json` / `GET npcs/<id>/full.json`): expose `slain`
  (real field) and `public_slain` under their own keys, both read-only.

### Filtering (mirrors `allegiance`/`public_allegiance`)

- `GET npcs.json` (public) filters `?slain=` against `public_slain`.
- `GET npcs/all.json` (DM) filters `?slain=` against the real `slain`.

### Frontend icon keys (`frontend/assets/js/utils/Icons.js`)

- Real slain button: `Icons.skullFill` (new, `bi-skull-fill`) / `Icons.heart` (existing,
  `bi-heart-fill`).
- Public slain button: `Icons.skull` (existing, `bi-skull`) / `Icons.heartOutline` (new,
  `bi-heart`).

### i18n keys consumed by frontend, produced by translator

`slain_confirm_modal.public_slain_title`, `slain_confirm_modal.public_revive_title`,
`slain_confirm_modal.public_slain_body`, `slain_confirm_modal.public_revive_body`,
`slain_confirm_modal.public_slain_button`, `slain_confirm_modal.public_revive_button` — added to
both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, same structure as the
existing `slain_*`/`revive_*` keys they sit alongside.

## Notes

- `slain` was deliberately kept out of `CharacterUpdateSerializer`/`CharacterCreateSerializer`
  (dedicated slain-toggle endpoint only) — this plan keeps `public_slain` out of those
  serializers too, for the same reason, even though `allegiance`/`public_allegiance` did get
  added there. No NPC create/edit form changes are needed.
- Migration backfills `public_slain` from each row's current `slain` value (per the issue), not
  just the field default — different from how `public_allegiance` was introduced (plain default,
  no backfill), since existing NPCs' real/public slain state was previously conflated.
