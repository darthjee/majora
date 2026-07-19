# Plan: Add a My Games page

Issue: [682-add-an-gameaccount-page.md](../../issues/682-add-an-gameaccount-page.md)

## Overview

Add a new `/#/my-games/` page listing every game the current user belongs to as cards, each
showing role, character, and conversation-activity badges. It's backed by a new authenticated
`GET /my-games.json` endpoint that aggregates per-game role/character/conversation data through
a dedicated response wrapper serializer, and linked from the header's Account dropdown.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API: `GET /my-games.json` (backend produces, frontend consumes)

- Auth required. Unauthenticated requests get `401` with the existing
  `UNAUTHENTICATED_RESPONSE_DATA` shape (`{"errors": {"detail": ["authentication required"]}}`),
  via the `require_authenticated` pattern (not DRF's `IsAuthenticated`).
- Success (`200`): a plain JSON array (no pagination), one item per game the requesting user has
  a `Player` row in:

```json
[
  {
    "game": { "name": "Curse of Strahd", "game_slug": "curse-of-strahd", "cover_photo_path": null },
    "role": "dm",
    "character": null,
    "conversations": { "count": 3, "unread_count": 1 }
  }
]
```

  - `game`: same shape as `GameListSerializer` (`name`, `game_slug`, `cover_photo_path`).
  - `role`: `"dm"` or `"player"`.
  - `character`: `{ "name": ..., "photo_url": ... }` (same shape as the existing
    `PlayerCharacterSerializer` used by `PlayerListSerializer`), or `null` when the role is `"dm"`
    or the player has no PC yet in that game.
  - `conversations.count`: number of conversations the user follows (is a `ConversationParticipant`
    of) that have at least one participant belonging to that game.
  - `conversations.unread_count`: subset of those with at least one unread (`not_seen=True`)
    `MessageVisualisation` for the user.

### i18n keys: frontend needs, translator provides

New keys (English text below; translator adds the matching Portuguese lines):

- `header.nav_my_games` = `"My Games"` — Account dropdown link text.
- `my_games.role_dm` = `"DM"` — role badge text.
- `my_games.role_player` = `"Player"` — role badge text.
- `my_games.following_tooltip` = `"Following {{count}} conversations"` — tooltip on the
  following-count badge, `{{count}}` replaced client-side (same `.replace('{{count}}', count)`
  convention as `game_page.open_polls_count`).
- `my_games.unread_tooltip` = `"{{count}} unread conversations"` — tooltip on the unread-count
  badge, same `{{count}}` convention.

Frontend implements the page assuming these keys exist; translator adds them to both `en.yaml`
and `pt.yaml` independently (no code dependency between the two agents beyond the key names above).

## Notes

- No pagination: "my games" lists are bounded by how many games one user plays, unlike the public
  `/games.json` list.
- New endpoint/serializers live under `backend/games/` (not `backend/conversations/`, which only
  has models/migrations today and no views/urls/serializers scaffolding) — see
  [backend.md](backend.md) for the exact query approach avoiding N+1 across games/players.
