# Issue: Add per-row kick control to faction character list

## Description

Split out of #943 (Add CharacterFaction). The faction show page's character-list panel (added in #943) is read-only aside from the "recruit" button/modal — it has no way to remove a character from the faction directly from that panel.

## Problem

Removing a character from a faction is only possible today via the character's own "quit" action (their enlist/quit modal, or its DM-privileged remove-all variant) — not from the faction's own character-list panel, where a DM/admin or player is already looking at the roster and would naturally expect to be able to manage it directly.

## Expected Behavior

A per-row "kick" control appears on the faction show page's character-list panel for every row the current viewer is authorized to act on. Clicking it opens a confirmation modal; confirming removes that character from the faction (via the existing per-character remove endpoints) and refreshes the panel to reflect the change.

## Solution

This issue is to add a per-row "kick" control to the faction's character-list panel, letting a player remove a character from the faction directly from the faction show page, reusing the existing per-character remove endpoints for the target character.

### Per-row permission

Any player of the game (not just DM/admin, and not just the character's owner) can see and use the kick control — this matches the existing, already-shipped permission model of the per-character remove endpoints, so no new backend endpoint or permission logic is needed:

- Reuse the existing per-character-detail endpoints as-is: `/games/:game_slug/pcs/:id/factions/remove.json` / `/games/:game_slug/pcs/:id/factions/remove/all.json`, and the NPC equivalents under `/games/:game_slug/npcs/:id/factions/...`. No new faction-scoped endpoint is created.
- **Non-DM/admin viewer**: the faction page already only shows them non-hidden characters (`factions/characters.json` excludes hidden rows entirely). Show a kick control on every visible row, and always call the `regular` variant (`.../factions/remove.json`). Server-side, this is already open to "staff or any player of this specific game" (`regular.create: [staff, player]` in `backend/permissions/config/game_pc_faction/endpoints.yml` / `game_npc_faction/endpoints.yml`, resolved via `Roles.is_player()` → `Game.has_player(user)`, i.e. requires an actual `Player` row for that `(game, user)` pair — not global authentication, and not ownership of the target character).
- **DM/admin viewer**: sees all rows, including hidden ones, via `factions/characters/all.json`. Show a kick control on every row and always call the `/all` variant (`.../factions/remove/all.json`), which already works unconditionally for DM/admin regardless of the target's hidden state.
- No new serializer field (e.g. no `can_kick`/permission flag) is needed on `GameFactionCharacterSerializer`. The only inputs required per row are the already-returned `type` (`pc`/`npc`) and `id`, used to build the endpoint URL; which variant (`regular` vs `/all`) to call is decided once per viewer (the same DM/admin flag the panel already uses to pick between `characters.json` and `characters/all.json`), not per row.
- The remove call still needs the current `game_faction_id` as a body param, matching the existing `RemoveFactionTabController` precedent.

### Confirmation UX pattern

Since this is a destructive action, kicking requires a confirmation step before submitting. Follow the codebase's dominant existing convention for destructive confirmations rather than `RemoveFactionTab.jsx`'s one-off inline select-then-confirm (which is tab-specific, not suited to a card grid):

- Add a dedicated `KickConfirmModal.jsx` + `KickConfirmModalHelper.jsx` pair, matching the shape already repeated three times in the codebase (`DeletePhotoConfirmModal`, `SlainConfirmModal`, `ClearCacheConfirmModal`): built directly on react-bootstrap's `Modal` (no shared generic `Modal` wrapper exists in `common/` to build on instead), with `Modal.Header` (translated title, close button), `Modal.Body` (one-line translated confirmation message, e.g. "Remove {character name} from {faction name}?"), and `Modal.Footer` with a `btn-secondary` Cancel button and a `btn-danger` Confirm/"Kick" button, driven by `show`/`onConfirm`/`onCancel` props from the parent card/row.
- Clicking a row's kick control opens this modal for that row's character; confirming triggers the remove call (per the "Per-row permission" section above) and closing/cancelling discards it.

### Card UI / affordance

`FactionCharacterCard`/`FactionCharacterCardHelper` currently wraps the entire card in a single `<a>` (photo + hover-name tooltip, no buttons) — a kick button can't be nested inside that anchor (invalid HTML, click-bubbling to navigate away). Follow the existing `TreasureCardHelper.jsx` pattern used elsewhere in the codebase for combining a card's primary navigation link with a secondary action button, rather than inventing a new approach:

- Card root becomes `<div className="card h-100 position-relative">` instead of the outer `<a>`.
- The navigation link moves to Bootstrap's `stretched-link` utility applied to the photo/name area (preserving the existing `CardHoverTooltip` hover behavior), which expands its click-target to the whole card without literally wrapping the card markup in `<a>`.
- A sibling, hover-revealed action button (matching the `.actions-overlay` convention from `PhotoCardHelper.jsx`) is added with `position: relative; z-index: 2` so it sits above the stretched-link and receives clicks directly — no nested anchor/button, no `stopPropagation` needed. Use the trash icon (`Icons.trash` / `bi-trash-fill`) or a person-remove equivalent.
- The kick button only renders for rows the current viewer is authorized to kick (per "Per-row permission" above) — hidden entirely when unauthorized, not shown-disabled.
- Clicking it opens the `KickConfirmModal` scoped to that row's character.

### Post-kick refresh / cache invalidation

A kick must purge the proxy-level GET cache for endpoints reading data it changes, using the existing `proxy/extension/lib/configuration/cache_cleanup/` mechanism (trigger-route → target-route purge, e.g. the photo-upload precedent at `proxy/extension/lib/configuration/cache_cleanup/factions.php:22`):

- Add cache-cleanup entries so the kick's trigger routes (`/games/:game_slug/pcs/:id/factions/remove.json`, `/games/:game_slug/pcs/:id/factions/remove/all.json`, and the NPC equivalents) purge `/games/:game_slug/pcs/:character_id/factions.json` / `/games/:game_slug/npcs/:character_id/factions.json` respectively (in `pcs.php`/`npcs.php`) — these work cleanly since the target only needs the trigger's own `:id`.
- Purging the faction's own `/games/:game_slug/factions/:faction_id/characters.json` is **out of scope for this issue** — the trigger routes don't carry `:faction_id` in the URL (it's a POST body param), so it can't be captured for substitution today. This gap is tracked separately in #1119; until resolved, the faction character-list panel stays cache-stale after a kick until TTL expiry, same as it already is for every other mutation on that panel.
- On the frontend, after a successful kick, force a refetch of the faction's character-list panel via its existing `refreshToken` prop (the same mechanism `RecruitModal` already uses to refresh the panel after a successful recruit).

### Edge cases

- **Double-kick / stale membership**: if the target character was already removed from the faction (race with another kick, or a stale panel), the remove endpoint returns a plain `Http404` with no special body. No special-cased UI handling needed — the existing generic error pattern (inline `ErrorAlert`, generic i18n error key, matching `RemoveFactionTabController`'s `setActionError`) covers this.
- **Pagination going out of range**: kicking the last row on the current page (e.g. the last item on the last page) can leave the panel pointed at a now-empty/out-of-range page after refetch. Use the pagination metadata the backend already returns (`pages` header — total pages, already computed server-side, already threaded into `FactionCharactersPanel`'s `pagination.pages` state via `RequestClient#buildPagination` → `FactionCharactersPanelController`, just unused for this today) rather than recomputing anything client-side: after the post-kick refetch, if `pagination.page > pagination.pages`, navigate to `pagination.pages` and refetch again.
- **`game_faction_id` trust**: the remove endpoint doesn't validate the faction id against any URL-scoped context — it only checks that the target character actually belongs to the given faction id. This is pre-existing behavior already shared by the character's own quit flow, not a new gap introduced by this issue; the frontend just sends the faction id already known from the page context (the faction currently being viewed).
- **Double-submit**: disable the Kick confirm button while the request is in flight, reusing the existing `submitting`-boolean pattern from `RecruitModalController`/`RemoveFactionTab`.

### Performance & security considerations

- **No new backend endpoints or authorization logic**: the kick action reuses the existing, already-reviewed remove/remove-all endpoints as-is. No new attack surface is introduced.
- **No per-row permission computation**: which endpoint variant (`regular` vs `/all`) to call is decided once per viewer (a single DM/admin flag, already available from how the panel picks its list-fetch endpoint), not per row — no N+1 permission/DB lookups added to the panel.
- **The confirmation modal is UX-only, not a security boundary**: server-side authorization is unchanged and enforced regardless of what the frontend renders or confirms; a player could already call the remove endpoints directly today with or without the modal.
- **Cache-cleanup additions are pattern config only** (`pcs.php`/`npcs.php` entries): negligible runtime cost, consistent with the existing purge mechanism's overhead for every other mutating route.
- **Friction-reduction / abuse surface**: this turns an existing-but-high-friction action (navigate to the target's own character page, use their quit modal) into a one-click button visible to any player on every row of the faction roster. Server-side permission is unchanged, so this isn't a new authorization gap, but it does lower the cost of kicking a teammate. Reviewed and accepted as an intentional trade-off, not requiring a notification/audit mitigation — majora games are small trusted groups of friends doing collaborative play, and being kicked from a faction costs a player nothing (no data loss).

### Scope boundaries

This issue is single-row kick only — one kick control per row, removing one character at a time. Bulk/multi-select kick (selecting and removing several characters at once) is explicitly out of scope; it would be a separate future issue if ever wanted.

### Testing strategy

- **Frontend component tests**: Jasmine specs for `KickConfirmModal`/`KickConfirmModalHelper`, the card's new action button and its per-viewer permission-gating (regular vs DM/admin visibility), and the pagination out-of-range step-back logic (`pagination.page > pagination.pages` after a post-kick refetch).
- **Proxy cache_cleanup config test**: verify the new `pcs.php`/`npcs.php` cache_cleanup entries actually purge `/games/:game_slug/pcs/:character_id/factions.json` / `/games/:game_slug/npcs/:character_id/factions.json` when the corresponding remove/remove-all trigger routes fire.
- **No new backend tests needed**: the remove/remove-all endpoints are reused as-is and are already covered by existing backend permission/behavior tests (e.g. `game_pc_faction_remove_test.py`); this issue adds no new backend logic.

## Benefits

Players and DMs/admins get a fast, low-friction way to manage faction membership directly from the faction page itself, without needing to navigate to each individual character's own page to remove them.
