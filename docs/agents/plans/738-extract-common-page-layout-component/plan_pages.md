# Plan: Extract common page layout component — per-resource page breakdown

Main plan: [plan.md](plan.md)

This file enumerates the concrete `showTypeConfig` slot breakdown for each resource type and maps
every route from the issue's affected-pages list to the phase that migrates it.

## `game` (Step 2 of plan.md)

Routes: `/#/games/new`, `/#/games/:game_slug`, `/#/games/:game_slug/edit`

- **Left** (show/edit only, `new` has none — game creation is a plain single-column form today):
  cover photo (`ActionsOverlay`/`ActionsOverlay` field-mode upload), next-session block,
  `OpenPollsWidget` (show-only, no field equivalent).
- **Right**: name (`h1` / `FormField`), description (`DescriptionBox` / `TextareaField`),
  `LinkList` (show-only — links aren't edited inline here today, confirm), game-type select
  (new/edit only), PCs/NPCs `PreviewSection`s (show-only).
- **Bottom**: none.
- No `dimmed`/`grayscale` concept for games.

## `game-item` / `pc-item` / `npc-item` (Step 3 of plan.md — done)

Routes:
- `/#/games/:game_slug/items/:id`, `:id/edit` (no `game-item` creation route exists —
  `HashRouteResolver.js` only registers `pcCharacterItemNew`/`npcCharacterItemNew`; the
  `/#/games/:game_slug/items/new` route listed below was aspirational and does not exist)
- `/#/games/:game_slug/pcs/:character_id/items/new`, `:id`, `:id/edit`
- `/#/games/:game_slug/npcs/:character_id/items/new`, `:id`, `:id/edit`

- **Left**: item photo (`ActionsOverlay` type `item`, show/edit have an upload affordance per
  `ItemDetailHelper`'s existing `canUploadPhoto`/`onUploadClick` params; creation has no photo
  slot, matching `CharacterItemNewHelper`'s existing single-column form), name (show-only heading,
  next to the photo — unlike `game`/`pc`/`npc`, whose heading lives in the right column), hidden
  switch (edit-only, under the photo).
- **Right**: title + error alert (new/edit-only), name field (new/edit-only), description
  (`DescriptionBox` show-only / plain `TextareaField` new/edit), hidden switch (new-only, inline
  with the other fields since creation has no left column), submit button (new/edit-only).
- **Bottom**: none.
- Info bar: hidden badge via `ItemCardHelper.buildInfoBarItems`, already shared with the list page.
- Collapsed the three item kinds (game/pc/npc) into one `item` `showTypeConfig` entry (not three
  near-identical entries) — the layout and fields are identical across all three response shapes,
  and each resource's own page component still owns its own controller/fetch/submit logic exactly
  as before.

## `pc` / `npc` (Step 4 of plan.md — most complex)

Routes:
- `/#/games/:game_slug/pcs/:id`, `:id/edit`
- `/#/games/:game_slug/npcs/new`, `:id`, `:id/edit`

- **Left**:
  - Avatar (`CharacterAvatar` / `CharacterAvatarField`), wrapped in the NPC-only allegiance
    border (`allegianceBorderClass`) — PC never wraps.
  - Action bar on the avatar: upload button, secondary slain/revive buttons (NPC show/edit only,
    built via `SlainSecondaryButtons`), info bar (`InfoBarRules.build`) — **must also pass
    `dimmed` for NPC show/edit**, matching what `GameNpcNewHelper` already does on creation
    (`GameNpcNewHelper.jsx:117`) but `CharacterAvatarHelper.render` currently omits
    (`CharacterAvatarHelper.jsx:32-44` passes only `grayscale={character.slain}`).
  - Name (`h1` / part of the top-level `FormField` on new/edit).
  - `LinkList` / `CharacterLinksField`.
  - `CharacterMoney` / `CharacterMoneyField`.
- **Right**:
  - `CharacterRole` / `CharacterRoleField`.
  - `CharacterDescription` / `CharacterDescriptionField`.
  - `CharacterDmNotes` / `CharacterDmNotesField`.
  - Treasures/items/documents `PreviewSection`s — show-mode only.
  - NPC-only allegiance/public-allegiance selects — new/edit-mode only.
- **Bottom**: `CharacterPhotosPreview` — show-mode only.
- NPC-only extras (slain confirm modal) stay layered on via the same `useExtra`-style extension
  point `CharacterDetail` uses today, rather than being baked into the shared `showTypeConfig`.
- `PcCharacterItem*`/`NpcCharacterItem*` pages are **not** part of this `pc`/`npc` config — they
  belong to the `pc-item`/`npc-item` configs above (item show/new/edit nested under a character).

## `treasure` (Step 5 of plan.md — done)

Routes: `/#/games/:game_slug/treasures/new`, `:id/edit` (there is no game-scoped
`/#/games/:game_slug/treasures/:id` *show* route — `HashRouteResolver.js` only registers
`gameTreasureNew`/`gameTreasureEdit`/`gameTreasures`; a treasure's detail page is always the
existing global `/#/treasures/:id` route, out of scope for this issue, same as `PlayerDetail` — the
`/#/games/:game_slug/treasures/:id` entry in the issue's affected-pages list was aspirational and
does not exist, the same situation Step 3 found for the `game-item` creation route)

- **Left**: none — game-scoped treasure creation/edit has always been a plain single-column form
  with no photo slot of its own (photo upload for treasures happens from the treasures *list*
  page's card overlay only, via the global `/treasures/:id/photo_upload.json` endpoint), mirroring
  `gameShowType.js`'s `new` mode, which likewise has no left-side content.
- **Right**: title + error alert (new/edit, shared component), name field (new/edit, shared),
  value field (new/edit, shared — wraps the existing `TreasureValueField`/`MoneyEditModal`
  mechanism as-is), `max_units` field (edit-only, gated on `!isExclusive`, matching
  `GameTreasureEditHelper`'s existing gating), submit button (new/edit, shared).
- **Bottom**: none.
- Kept to a **single** `treasure` config entry (not two) backing only the game-scoped
  `GameTreasureNew`/`GameTreasureEdit` — the global (non-game-scoped)
  `Treasure`/`TreasureNew`/`TreasureEdit` pages are not on the issue's affected-pages list and were
  left unmigrated, since their field sets genuinely differ (a `game_type` picker on creation, no
  `max_units` cap on edit) and folding them in would need a second entry anyway.

## Route → phase cross-reference

| Route | Phase |
|---|---|
| `/#/games/new` | game |
| `/#/games/:game_slug` | game |
| `/#/games/:game_slug/edit` | game |
| `/#/games/:game_slug/treasures/new` | treasure |
| `/#/games/:game_slug/treasures/:id` | *(does not exist — see `treasure` section above)* |
| `/#/games/:game_slug/treasures/:id/edit` | treasure |
| `/#/games/:game_slug/items/:id` | game-item |
| `/#/games/:game_slug/items/:id/edit` | game-item |
| `/#/games/:game_slug/pcs/:id` | pc |
| `/#/games/:game_slug/pcs/:id/edit` | pc |
| `/#/games/:game_slug/npcs/new` | npc |
| `/#/games/:game_slug/npcs/:id` | npc |
| `/#/games/:game_slug/npcs/:id/edit` | npc |
| `/#/games/:game_slug/pcs/:character_id/items/new` | pc-item |
| `/#/games/:game_slug/pcs/:character_id/items/:id` | pc-item |
| `/#/games/:game_slug/pcs/:character_id/items/:id/edit` | pc-item |
| `/#/games/:game_slug/npcs/:character_id/items/new` | npc-item |
| `/#/games/:game_slug/npcs/:character_id/items/:id` | npc-item |
| `/#/games/:game_slug/npcs/:character_id/items/:id/edit` | npc-item |
