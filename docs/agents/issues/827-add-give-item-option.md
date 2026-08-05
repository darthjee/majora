# Issue: Add give item option

## Description

When viewing an item's detail page (`/#/games/:game_slug/items/:id`), there is currently no way
to give that item to one or more characters in bulk. This issue adds an **Add Item** button that
opens a modal for granting the item to any number of PCs/NPCs at once, with a configurable
quantity per character.

The modal has two sides:
- **Left side**: two tabs (PC / NPC), each listing characters with a search query box. Clicking a
  character adds it once to the right-side list; a character may be added more than once (see
  "Right-side row controls" under Expected Behavior).
- **Right side**: the list of characters chosen to receive the item, showing each character's
  name and type, how many of the item they already own, and how many new `CharacterItem`
  instances will be created for them.

Bottom buttons:
- **Cancel** closes the modal.
- **Clear** empties the list of characters receiving the item.
- **Submit** sends one create request per new item instance across all listed characters.

## Problem

There is currently no bulk way for a DM (or a player, for their own PC) to grant an item to
multiple characters, or multiple copies of an item to a single character, without manually
repeating the existing single-item acquire flow once per instance.

## Expected Behavior

**Button visibility**: the "Add Item" button is visible to dm, admin, and regular players alike
— there's no button-level permission gate. Per-character permission is naturally enforced by the
reused `acquire.json` endpoint's existing `restricted`/`create` check (`_check_item_create`): dm/
admin can give the item to any character, a player who owns a PC can give it to their own PC, and
any other combination (e.g. a player targeting an NPC or someone else's PC) fails at submit time
per-character, surfaced the same way as any other failed create request. Whether a character even
shows up in the left-side list, and whether its owned quantity is visible, is separately gated by
which summary endpoint variant (`summary.json` vs `summary/all.json`) the current user is allowed
to call.

**Search**: the left-side list's query box is a server-side search, not a client-side filter over
a pre-fetched list — it re-queries the existing pc/npc list endpoints (debounced as the user
types) using the `name` query param they already support.

**Submit behavior**: all pending create requests are fired regardless of others failing
(best-effort, not stop-on-first-failure). The modal reports a per-character/per-item summary of
which creates succeeded and which failed. Whether a given request succeeds or fails, the modal
re-fetches that character's owned quantity via the summary endpoint afterward, so the displayed
"already owns" count always reflects actual server state rather than an optimistic local tally.

**Mid-submit lock**: once submit is clicked, `cancel`, `clear`, and closing the modal are all
disabled until every in-flight create request has settled (success or failure) — no partial
abandonment while requests are still in the air.

**Right-side row controls**: each row on the right side (a character already added to the
"receiving" list) has, using the existing `bootstrap-icons` package (`bi bi-*` classes) and
`OverlayTrigger`/`Tooltip` wrapping:
- `bi-caret-up-square-fill` / `bi-caret-down-square-fill` next to the "new CharacterItem to
  create" count, to increment/decrement that character's pending quantity. The decrement floors
  at 1 — it cannot reach 0 this way (to drop a character entirely, use the remove icon below).
- `bi-person-x` (or `bi-person-x-fill`) on the far right of the row, to remove that character
  from the list entirely.
- Every icon carries a tooltip explaining its action.
- Both numbers shown per row (already-owned quantity, and pending-to-create quantity) carry a
  tooltip explaining what each represents.
- Removing the last remaining row empties the right-side list, which collapses the modal back to
  the single-column (search-only) layout.

## Solution

### New endpoints

New endpoints, nested under the item (matching the existing
`games/:game_slug/items/<item_id>/...` sub-resource convention, e.g. `full.json`,
`photo_upload.json`), scoped to a single character each — called once per character as it's
added to the modal's right-side list (not batched), since the `owner` permission tier on the
`pcs/.../summary/all.json` variant only ever applies to that requester's own single PC and
doesn't map onto a batched, multi-character request:
- `GET /games/:game_slug/items/:item_id/npcs/:character_id/summary.json` # regular to everyone
- `GET /games/:game_slug/items/:item_id/pcs/:character_id/summary.json` # regular to everyone
- `GET /games/:game_slug/items/:item_id/npcs/:character_id/summary/all.json` # restricted to dm and admin
- `GET /games/:game_slug/items/:item_id/pcs/:character_id/summary/all.json` # restricted to dm and admin and owner

`item_id` and `character_id` are both path params. This returns

```json
{ "quantity": <count> }
```

`quantity` counts existing `CharacterItem` rows for that `(character, game_item)` pair. For
regular endpoints, `CharacterItem.hidden` rows are not counted; `GameItem.hidden` itself is
irrelevant here (whether the requester can reach this item at all is already gated by the item
detail page/endpoint, not by this summary endpoint).

Since this is a single-character lookup (not a batch array), a hidden character_id (or one the
requester otherwise lacks permission to see) 404s on the regular endpoint, matching the existing
single-resource convention (`character_detail`'s `check_hidden` → `_hidden_gate_response`), rather
than being silently omitted.

### Data model: multiple instances of the same item per character

`CharacterItem` currently has `unique_together = [('character', 'game_item')]`, so a character
can only ever own 0 or 1 of a given `GameItem`. This issue needs a character to be able to own
several instances of the same item (e.g. 3 potions), so that constraint must be dropped
(migration required).

"Giving an item" means creating a new `CharacterItem` row with blank `name`/`description`/`photo`
(these fall back to the linked `GameItem`'s own values when serialized, as they already do today)
and `hidden` copied from the `GameItem`'s `hidden` value. To give a character N of the same item,
the frontend fires N separate create requests — one `CharacterItem` per instance, no `quantity`
field on the model itself. The right-side panel's "number of new CharacterItem we will create"
count is purely a frontend tally of pending create requests for that character.

#### Creation endpoint

This reuses the existing `POST /games/:game_slug/{npcs,pcs}/:id/items/acquire.json` endpoint
(`character_item_acquire` in `backend/games/views/game/_item_exchange.py`) rather than adding a
new one. That endpoint currently uses `get_or_create` and returns a 400 `"already owned"` error
when a `CharacterItem` for the pair already exists — this check must be removed so it always
creates, matching the relaxed model constraint. This intentionally also changes behavior for
whatever existing self-service "acquire item" flow already calls this endpoint (players will be
able to acquire duplicate items too, not just DMs via the new bulk modal).

### Shared two-column layout component

The existing resource-exchange tabs (`BuyTreasureTab`, `SellTreasureTab`, `AcquireTreasureTab`,
`RemoveTreasureTab`, `AcquireItemTab`, `RemoveItemTab`, `AcquireDocumentTab`,
`RemoveDocumentTab` — all under
`frontend/assets/js/components/resources/character/pages/elements/tabs/`) each duplicate the same
pattern: render a single browse-pane column until something is selected, then wrap it plus a
detail pane in a Bootstrap `row`/`col-6` layout (e.g.
`tabs/helpers/BuyTreasureTabHelper.jsx:36-61`, `tabs/helpers/AcquireItemTabHelper.jsx:37-50`). No
shared component currently factors this out.

This issue introduces a shared two-column layout component (`browsePane`/`detailPane` props,
where a `null`/absent `detailPane` renders single-column) and uses it for the new give-item
modal: left column is the pc/npc tab + search + character list (`browsePane`), right column is
the list of characters chosen to receive the item (`detailPane`), which stays absent — no right
column at all — until the first character is picked.

Retrofitting the 8 existing exchange tabs to use this new shared component is explicitly **out of
scope** for this issue — tracked separately as [#988](https://github.com/darthjee/majora/issues/988).

### Caching

`backend/games/decorators.py` already has `@restricted` (unconditionally sets `X-Skip-Cache:
true` on every response) and `@regular` (currently a no-op, kept as the explicit counterpart so
every view is annotated one way or the other — and reserved for future regular-endpoint-specific
behavior beyond caching).

The new `summary.json` endpoints are permission-`@regular` (visible to everyone, not dm/admin-
restricted) but their responses are per-character-per-item and not worth caching — with many
characters/items in play this would otherwise clog the proxy cache with a huge number of
near-never-reused entries. Since cache-skipping shouldn't keep riding on `@regular` (which is
meant to grow non-cache-related meaning later), this issue introduces a new decorator,
`@skip_cache`, in `backend/games/decorators.py`: same unconditional `X-Skip-Cache: true` behavior
as `@restricted` (likely sharing its implementation), but applied to endpoints that are otherwise
permission-`@regular`. The two new `summary.json` views (npcs and pcs) are decorated with both
`@regular` and `@skip_cache`; the `/summary/all.json` views keep just `@restricted` as usual,
which already implies the skip unconditionally.

### Navi cache-warmer

The new `summary.json` endpoints are **not** added to the Navi warmer config
(`navi/resources/pcs.yml` / `npcs.yml`) for now — left unwarmed, consistent with `@skip_cache`
marking them as not cache-worthy in the first place.

## Benefits

- Lets DMs (and players, for their own PC) grant an item to many characters — and multiple copies
  to the same character — in a single modal flow instead of repeating the single-item acquire
  request by hand.
- Extracts a shared two-column layout component that the give-item modal is the first consumer
  of, paving the way for removing the duplicated layout code across the 8 existing exchange tabs
  (tracked separately in #988).
- Keeps the new per-character summary endpoints out of the proxy cache via a purpose-built
  `@skip_cache` decorator, avoiding cache pollution from a high-cardinality, rarely-reused
  endpoint shape.
