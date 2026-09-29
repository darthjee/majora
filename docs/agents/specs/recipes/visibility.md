# Visibility

Hidden rules for recipes, including masking of hidden output items. Part of the
[Recipes spec](../recipes.md).

## Base pattern

Recipes follow the
[default hidden-gated collection pattern](../../access-control/principles.md#default-hidden-gated-collection-pattern):
plain endpoints exclude hidden rows and never expose `hidden`; `/all.json` and
`/full.json` include them and expose `hidden`.

## Hidden output item is masked

- When a visible `GameRecipe`'s output `GameCommonItem` is hidden, the plain
  (non-restricted) recipe endpoints return the output as `null` — no id, name
  or photo leaked. `/all.json` and `/full.json` return it in full to `GameEdit`
  callers; a PC's owning player reading the PC `CharacterEdit` variants still
  sees it masked.
- The same masking applies wherever a recipe's output is embedded in a
  `CharacterRecipe` response.
- The frontend renders a masked output as an "unknown" placeholder.

## Category filter masking

- The recipe list can be filtered by the output item's `category`
  (`?category=<value>`).
- On the plain endpoint, recipes whose output is masked **never match** a
  category filter, so the filter cannot leak a hidden item's category.
  Unfiltered, they still appear, masked.
- The GM `/all.json` variant filters on the real category.

## CharacterRecipe hidden flag

- `CharacterRecipe.hidden` is independent of `GameRecipe.hidden`, like
  `CharacterItem` / `CharacterPossession`: on character endpoints only
  `CharacterRecipe.hidden` matters — `GameRecipe.hidden` is ignored there.
- A new `CharacterRecipe` copies `GameRecipe.hidden` at creation, so linking a
  secret recipe never reveals it through the character page by accident; the
  GM — or, on a PC, anyone with `CharacterEdit` (including the owning player)
  — can unhide it later through
  [`PATCH .../recipes/<character_recipe_id>.json`](api-contract.md#toggling-hidden-patch).
  Unhiding publishes the linked recipe's display fields on the character's
  plain endpoints even if `GameRecipe.hidden` is true.

## Available / acquire

- The character's `available` recipe list excludes hidden `GameRecipe`s (and
  recipes already known).
- The regular `acquire` returns `404` for a hidden `GameRecipe`; only the GM
  variant (`acquire/all`) can link one.

## NPCs

The hidden-NPC gate applies to every NPC recipe endpoint as for other
character sub-resources. NPC `incognito` has no effect on the character recipe
endpoints (as for the `CharacterDocument` / `CharacterPossession` indexes); it
only excludes the NPC from `recipes/<id>/characters.json` (see below).

## Recipe → characters who know it

- The plain variant `404`s if the recipe itself is hidden, and excludes hidden
  `CharacterRecipe` rows and hidden / incognito NPCs.
- The `/all.json` variant includes everything and exposes `hidden`.
