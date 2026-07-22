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

## `game-item` / `pc-item` / `npc-item` (Step 3 of plan.md)

Routes:
- `/#/games/:game_slug/items/new`, `:id`, `:id/edit`
- `/#/games/:game_slug/pcs/:character_id/items/new`, `:id`, `:id/edit`
- `/#/games/:game_slug/npcs/:character_id/items/new`, `:id`, `:id/edit`

- **Left**: item photo (`ActionsOverlay` type `item`, show/new/edit all have an upload
  affordance per `ItemDetailHelper`'s existing `canEdit`/`onUploadClick` params), name.
- **Right**: description (`DescriptionBox` / `TextareaField`).
- **Bottom**: none.
- Info bar: hidden badge via `ItemCardHelper.buildInfoBarItems`, already shared with the list page.
- Confirm during implementation whether the three item kinds (game/pc/npc) can collapse into one
  `showTypeConfig` entry parameterized by URL segment (mirroring `buildFetchCharacterItems`'s
  `characterKind` parameterization in `listTypeConfig.js`), rather than three near-identical
  entries.

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

## `treasure` (Step 5 of plan.md)

Routes: `/#/games/:game_slug/treasures/new`, `:id`, `:id/edit`

- **Left**: treasure photo (`ActionsOverlay` type `treasure`), name, hidden badge (reuse
  `TreasureCardHelper.buildInfoBarItems`, already used by the list page's `treasures` type).
- **Right**: description, value/quantity fields (new/edit), any other treasure-specific fields —
  confirm exact field set against `TreasureNewHelper`/`TreasureEditHelper`/`GameTreasureEditHelper`
  during implementation, since there are two edit variants (global `TreasureEdit` vs. game-scoped
  `GameTreasureEdit`) that may need to collapse into one `treasure` config entry parameterized the
  same way, or may genuinely need two entries if the game-scoped variant has distinct fields/URLs.
- **Bottom**: none.

## Route → phase cross-reference

| Route | Phase |
|---|---|
| `/#/games/new` | game |
| `/#/games/:game_slug` | game |
| `/#/games/:game_slug/edit` | game |
| `/#/games/:game_slug/treasures/new` | treasure |
| `/#/games/:game_slug/treasures/:id` | treasure |
| `/#/games/:game_slug/treasures/:id/edit` | treasure |
| `/#/games/:game_slug/items/new` | game-item |
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
