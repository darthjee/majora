# Frontend Plan: Add per-row kick control to faction character list

Main plan: [plan.md](plan.md)

## Shared contracts

- Reuse the existing `faction.remove` request config as-is (`frontend/assets/js/utils/requests/config/factionConfig.js:92-136` — `removePath`/`removeAllPath`, `regular`/`private` variants). No new request config needed; no backend/proxy changes are required for the remove call itself to work.
- Call shape, mirroring `RemoveFactionTabController.remove`/`confirmRemove` (`frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveFactionTabController.js:85-132`) exactly:
  ```js
  RequestStore.mutate({
    componentName: '<NewController>',
    resource: 'faction',
    method: 'POST',
    quantityType: 'remove',
    params: { gameSlug, kind: type === 'pc' ? 'pcs' : 'npcs', id: characterId },
    body: { game_faction_id: factionId },
    variantName: isDmOrAdmin ? 'private' : 'regular',
  })
  ```
  A `204` response means success; anything else maps to a generic error key (same `faction_exchange_modal.generic_error`-style pattern).
- After a successful kick: call `RequestStore.purge({ resource: 'faction' })` (client-side cache), then trigger the faction panel's `refreshToken`-driven refetch. Do **not** rely on the proxy purging the faction's own `characters.json` — that gap is out of scope here (#1119); this refetch is the only thing that will show the row disappearing.

## Implementation Steps

### Step 1 — Restructure `FactionCharacterCard` to allow a sibling action button

Files: `frontend/assets/js/components/resources/faction/pages/elements/FactionCharacterCard.jsx`, `.../helpers/FactionCharacterCardHelper.jsx`.

Currently the whole card is one `<a href={href}>` (`FactionCharacterCardHelper.jsx:30-41`) wrapped in `CardHoverTooltip`. Follow the `TreasureCardHelper.jsx` pattern (`frontend/assets/js/components/common/cards/helpers/TreasureCardHelper.jsx`) instead:

- Card root becomes `<div className="card h-100 position-relative">`.
- Move navigation to a `stretched-link` anchor scoped to the photo/name area (keep it inside `CardHoverTooltip` so the hover-name behavior is unchanged).
- Add a sibling action button, `position: relative; z-index: 2` (see `main.scss:169-172` for the existing `.card-action-link`/`.actions-overlay` z-index convention, and `PhotoCardHelper.jsx` for the hover-reveal `.actions-overlay` markup/CSS this should reuse), rendered only when the card is passed a `canKick`/`onKick` prop (see Step 3) — i.e. hidden entirely, not disabled, when the viewer isn't authorized for that row.
- Icon: prefer `Icons.personX` (`bi-person-x`, `frontend/assets/js/utils/ui/Icons.js:59`) over the generic trash icon — it reads more accurately as "remove this person" than a delete/trash affordance. Confirm against existing icon usage conventions in nearby cards; fall back to `Icons.trash` only if `personX` doesn't fit the existing icon-button styling.

### Step 2 — Add `KickConfirmModal`

New files: `frontend/assets/js/components/resources/faction/pages/elements/KickConfirmModal.jsx`, `.../helpers/KickConfirmModalHelper.jsx` (colocate next to `FactionCharacterCard`, same pattern as `DeletePhotoConfirmModal`/`DeletePhotoConfirmModalHelper.jsx` under the character resource — `frontend/assets/js/components/resources/character/pages/elements/DeletePhotoConfirmModal.jsx` + `helpers/DeletePhotoConfirmModalHelper.jsx`).

- Built directly on react-bootstrap `Modal` (no shared generic wrapper exists) — `Modal.Header` (translated title, close button), `Modal.Body` (one-line translated message, e.g. "Remove {character name} from {faction name}?"), `Modal.Footer` with `btn-secondary` Cancel and `btn-danger` Confirm/"Kick" buttons.
- Props: `show`, `character` (or `characterName`), `factionName`, `onConfirm`, `onCancel`, `submitting` (disables the Confirm button while the request is in flight — mirror `RemoveFactionTab.jsx:31,74-80`'s `submitting` state / `RemoveFactionTabHelper.jsx:62`'s `disabled={submitting}`).
- Add the required i18n keys under `frontend/assets/i18n/` for all supported languages (see the translator agent's conventions if unclear; the `check_i18n` CI job will fail if any language is missing a key).

### Step 3 — Wire kick state into `FactionCharactersPanel`

Files: `frontend/assets/js/components/resources/faction/pages/elements/FactionCharactersPanel.jsx`, `.../controllers/FactionCharactersPanelController.js`, `.../helpers/FactionCharactersPanelHelper.jsx`.

- Add a new controller method (e.g. `kick(gameSlug, character, factionId, isDmOrAdmin)`) implementing the request shape from "Shared contracts" above, following `RemoveFactionTabController.remove`/`confirmRemove`'s shape (loading/error/success handling, `RequestStore.purge`, then bump `refreshToken`).
- Determine `isDmOrAdmin` from whatever flag the panel already uses to choose between `characters.json`/`characters/all.json` (same source of truth, viewer-level, not per-row) — thread it down to each `FactionCharacterCard` as `canKick={true}` for every row when true, and per-row only for non-hidden rows when false (non-DM/admin viewers never see hidden rows to begin with, so this reduces to "always true" for every row they can see).
- Track which character is pending kick-confirmation (open `KickConfirmModal` for that character), plus `submitting`/error state, in the panel or a small local controller — mirror the state shape already used by `RecruitModalController`/`RemoveFactionTabController` (`{submitting, error}`).
- On confirm: call the kick request; on success, close the modal, purge, bump `refreshToken`; on failure, surface the generic error inline (`ErrorAlert`, matching `FactionCharactersPanelHelper.jsx:4,42`'s existing error-rendering pattern) — do not special-case the 404 (already-removed) case.

### Step 4 — Pagination out-of-range recovery after a kick

File: `frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js` (and/or `FactionCharactersPanel.jsx`, wherever the `refreshToken`-triggered refetch effect lives, `FactionCharactersPanel.jsx:21-31`).

- Page number is sourced from the URL hash query string (no internal pagination state) — after the post-kick refetch, compare the returned `pagination.page` against `pagination.pages`; if `page > pages`, navigate to `pages` (update the hash query param) and let the effect refetch again. There's no existing "step back a page" helper anywhere in the codebase to reuse — this is new logic, scoped narrowly to this panel; don't build a generic abstraction for it.

## Files to Change

- `frontend/assets/js/components/resources/faction/pages/elements/FactionCharacterCard.jsx` — pass through new `canKick`/`onKick` props.
- `frontend/assets/js/components/resources/faction/pages/elements/helpers/FactionCharacterCardHelper.jsx` — restructure card markup (stretched-link + sibling action button).
- `frontend/assets/js/components/resources/faction/pages/elements/KickConfirmModal.jsx` — new.
- `frontend/assets/js/components/resources/faction/pages/elements/helpers/KickConfirmModalHelper.jsx` — new.
- `frontend/assets/js/components/resources/faction/pages/elements/FactionCharactersPanel.jsx` — wire kick state, pending-confirmation character, `refreshToken` bump, pagination out-of-range recovery.
- `frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js` — new `kick(...)` method mirroring `RemoveFactionTabController`.
- `frontend/assets/js/components/resources/faction/pages/elements/helpers/FactionCharactersPanelHelper.jsx` — render the modal, thread `canKick`/`onKick` to each card, render kick-related errors.
- `frontend/assets/i18n/*/<namespace>.json` (all supported languages) — new keys for the confirm modal's title/body/buttons and any new error text.
- New Jasmine specs alongside each new/changed component (`*.test.jsx` or this codebase's existing spec-naming convention — check a neighboring spec file, e.g. for `RemoveFactionTab`, before naming new ones).

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — Jasmine specs for the new components/logic.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — ESLint.
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — verifies every new translation key exists in all languages.

## Notes

- Bulk/multi-select kick is explicitly out of scope (per the issue) — one control per row, one character per confirm.
- The faction's own `characters.json` cache staying stale after a kick (until the panel's own `refreshToken` refetch, or TTL expiry for other viewers/tabs) is expected and tracked separately in #1119 — don't try to work around it here.
- `Icons.personX` was found during planning as a better semantic fit than the trash icon used by other destructive-confirm precedents; verify it renders sensibly at the card's action-button size before committing to it.
