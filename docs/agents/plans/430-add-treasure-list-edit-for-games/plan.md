# Plan: Add treasure list edit for games

Issue: [430-add-treasure-list-edit-for-games.md](../../issues/430-add-treasure-list-edit-for-games.md)

## Overview

Today, `Game.treasures` (the M2M `GameTreasure` link) has no application-level way to be
created — only Django admin's `GameTreasureInline` can link an existing `Treasure` to a game
(per `docs/agents/access-control/game-treasure.md`'s "Create/Delete the link itself" row).
Backend adds two new DM/superuser-only endpoints: `GET /games/:game_slug/treasures/missing.json`
(catalog treasures of the game's `game_type` not yet linked to it) and
`POST /games/:game_slug/treasures/link.json` (creates the `GameTreasure` row for an existing
treasure, given `value`/`hidden`/`max_units`). Frontend adds an "Add treasure" button and modal
to the game treasures page, mirroring `TreasureExchangeModal`'s browse → select → form shape,
using the two new endpoints.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**`GET /games/:game_slug/treasures/missing.json`** — `GameEditPermission`-gated (DM of the
game, or superuser — 401 unauthenticated, 403 non-editor), paginated (same `page`/`per_page`
envelope as `treasures.json`/`treasures/all.json`). Returns `Treasure` rows where
`game_type == game.game_type`, `game` is `null` (shared catalog only — excludes treasures
exclusive to *other* games, which would otherwise slip through a `game_type` match), and no
`GameTreasure` row exists yet for `(game, treasure)`. Serialized with the existing
`TreasureListSerializer` shape: `id`, `name`, `value` (falls back to `Treasure.value` since no
`GameTreasure` row exists — exactly the issue's "already filled value of the Treasure" ask),
`game_type`, `photo_path`, `game_slug` (`null` for these, since they're unlinked), plus
`available_units`/`max_units` (both `null`, same reason). No query params/filters beyond
pagination — the issue does not ask for search/max_value on this list.

**`POST /games/:game_slug/treasures/link.json`** — same `GameEditPermission` gate. Request
body: `{treasure_id: number, value: number, hidden?: boolean, max_units?: number|null}`.
`treasure_id` must resolve to a `Treasure` with matching `game_type` and no existing
`GameTreasure` for this game (400 otherwise — reusing the same validation the listing above
performs, so a stale modal selection can't silently succeed). On success, creates the
`GameTreasure` row (`game`, `treasure`, `value`, `hidden` default `false`, `max_units` default
`null`) and responds `201` with `TreasureDetailSerializer` detail (same shape returned by
`POST /games/:game_slug/treasures.json` today). This is a new, separate endpoint — it does
**not** touch the existing `POST /games/:game_slug/treasures.json`, which keeps creating
brand-new exclusive treasures exactly as it does today.

## Notes

- `max_units`'s switch-gated visibility (issue: "a switch shows the input for `max_quantity`
  \[sic — the model field is `max_units`\], and when off, sends `null`") is a new interaction
  pattern for this codebase — the existing `GameTreasureEdit` form instead treats an empty
  string as `null` with no switch. This plan follows the issue literally (new switch-gated
  field), scoped to this one modal; it does not retrofit `GameTreasureEdit`.
- `hidden`'s translation key (`game_treasures_page.hidden_label`, already present in both
  `en.yaml`/`pt.yaml`) is reused as-is — no new translator work expected beyond a couple of
  new keys for the modal's own copy (button label, list/empty/error text), handled directly by
  the frontend agent per `frontend.md`.
