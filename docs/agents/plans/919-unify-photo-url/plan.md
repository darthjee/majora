# Plan: Unify photo url

Issue: [919-unify-photo-url.md](../../issues/919-unify-photo-url.md)

## Overview

`Game.cover_photo` and `Character.profile_photo` are renamed to `photo` (model relationship, `*_id` DB column, and serializer field `photo_path`), matching the naming already used by `Treasure`, `GameItem`, `CharacterItem`, `GameDocument`, and `GameDocumentFile`. The backend renames the model fields, migration, serializers, and the views that set/clear the relationship. The frontend then reads `photo_path` uniformly, dropping the per-entity `photoUrl` override getters that existed only to paper over the old naming split.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

API response field rename (read-only, no request/write payload changes — photo upload/finalize/delete stay on their existing multipart/id-based endpoints):

- `Game`: serializer field `cover_photo_path` -> `photo_path` (still `string|null`, still absent/`null` when no photo set). Affects `GameListSerializer` and `GameDetailSerializer`, and therefore any endpoint returning a `Game` payload, including the game embedded in the "my games" list (`MyGameListItem` reads `data.game.cover_photo_path` today).
- `Character` (PC/NPC): serializer field `profile_photo_path` -> `photo_path`, and `profile_photo_id` -> `photo_id`. Same nullability and the same incognito-hiding behavior (an incognito character's `photo_path` still resolves to `null` for public-facing serializers) — only the field name changes, not the logic. Affects `CharacterListSerializer`, `CharacterDetailSerializer`, `CharacterFullSerializer`, `CharacterFullListSerializer`, and `PlayerCharacterSerializer`.
- No other entity's field name changes (`Treasure`, `GameItem`, `CharacterItem`, `GameDocument`, `GameDocumentFile`, and the pass-through entities `CharacterDocument`/`GameTreasure`/`CharacterTreasure`) already expose `photo_path` and are untouched.
- Out of scope, per the issue: `Photo` models' own `path` column, and `User`'s Gravatar-based `photo_url`.

Sequencing: land the backend rename first (or in the same PR); the frontend rename depends on the new field names being present in API responses.

## Notes

- No `CI Checks` at this index level — see each agent's file for its own commands.
