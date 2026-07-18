# Issue: Unify elements lists

## Problem
Several show pages render small preview lists of related entities (Player Characters, Non-Player Characters, Treasures) with duplicated layout code:

- Game show page (`/#/games/:game_slug`): PCs and NPCs previews already share `CharacterPreviewSection`/`CharacterPreviewCard`, parameterized by `characterType`.
- PC and NPC show pages (`/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/npcs/:id`): the Treasures preview is already a single shared `CharacterTreasuresPreview` component used by both PC and NPC.

Despite that partial sharing, the character-preview family and the treasure-preview family are still two separate component/constant sets with duplicated shell logic (heading, item slicing, row of cards, "see more" card), and inconsistent item caps: character previews cap at 5 items, treasure previews cap at 6 items, both followed by a "see all" card. There is also no shared constants file mapping an entity type to its endpoint, icon, and title — these are hardcoded per call site today.

## Solution
- Create one dedicated, generic preview-list component that both the character-preview and treasure-preview use cases render through.
  - Standard `page_size` of 5 items for all types (including Treasures, which currently caps at 6 — this is reduced to 5 for consistency), followed by a 6th "see more" element reusing the existing `SeeAllCard` component/pattern.
  - The component takes a "type" that resolves to endpoint, icon, and title via a new constants file (entity type → {endpoint builder, icon, title}), instead of each call site hardcoding these values.
  - Per-type endpoint config supports an optional authenticated-endpoint variant, preserving the NPCs preview's current behavior of using `npcs/all.json` when a token is present and falling back to the public `npcs.json` otherwise.
- Remove the text block currently rendered beneath each item's photo and surface that same information via a mouse-over tooltip instead, reusing the existing `TooltipBadge`/react-bootstrap `Tooltip` pattern already used elsewhere in the app.
  - Treasures cards: tooltip shows both name and money value (same info shown today as `card-title`/`card-text`, just relocated to hover).
  - PC/NPC preview cards: these currently show no text at all beneath the photo; a name tooltip is added net-new for consistency with the other preview types.

### Pages

#### Game show page `/#/games/:game_slug`

##### PCs list
- Title: Player Characters
- Endpoint: `/games/:game_slug/pcs.json`
- See more Icon: bootstrap `file-earmark-person`

##### NPCs list
- Title: Non-Player Characters
- Endpoint: `/games/:game_slug/npcs.json` (public), `/games/:game_slug/npcs/all.json` (authenticated)
- See more Icon: bootstrap `file-earmark-person-fill`

#### PC show page `/#/games/:game_slug/pcs/:id`

##### Treasures
- Title: Treasures
- Endpoint: `/games/:game_slug/pcs/:id/treasures.json`
- See more Icon: bootstrap `gem`

#### NPC show page `/#/games/:game_slug/npcs/:id`

##### Treasures
- Title: Treasures
- Endpoint: `/games/:game_slug/npcs/:id/treasures.json`
- See more Icon: bootstrap `gem`

### What this is

This is a pure frontend change — no permissions are being changed.
