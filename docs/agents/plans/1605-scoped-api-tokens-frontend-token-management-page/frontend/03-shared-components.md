# Shared token cells and revoke modal

Build the pieces that #1606 reuses. Put them where both the account page and the staff user page
can import them. The suggested home is `components/common/api_tokens/`, next to the other shared
`components/common/*` folders. Do not put them under `account/pages/elements/`.

- **`ApiTokenScopes`**: a module exporting the UI-only family-to-group constant (see the shared
  contract), in group order, with helpers:
  - `familyOf(scope)` and `actionOf(scope)` split `"<family>:<action>"`;
  - `groupScopes(scopes)` returns `[{group, families: [{family, read, write}]}]` in group order.
    Families that aren't in the constant are dropped, which keeps the UI safe if the catalogue
    grows.
- **`ApiTokenStatusBadges`**: `build(token)` returns `{variant, text}` from the API `status`
  (`active` → success, `expired` → secondary). It is styled like `RecoveryTokenStatusBadges.js`
  and lives next to it in `components/common/list_types/`. Do not recompute the status.
- **`ApiTokenCellsHelper`**: static render helpers for one row:
  - the name;
  - `mjr_<prefix>…` in monospace;
  - scope badges, one per family in group order, e.g. "NPCs: read/write", using
    `family_<f>` and `scope_read`/`scope_write`/`scope_read_write`;
  - games: chips with the game names, or an "All games" badge with the
    `all_games_tooltip` tooltip when `games` is empty;
  - expires: `toLocaleDateString(Translator.getLanguage())`, or "Never" for null, with the full
    `toLocaleString` in a tooltip;
  - last used: `toLocaleString`, or "Never used";
  - created: `toLocaleString`;
  - the status badge.
- **`ApiTokenRevokeConfirmModal`**: a react-bootstrap `Modal`, with its markup in a
  `helpers/ApiTokenRevokeConfirmModalHelper.jsx`, following the account `elements/` modals. Props:
  `show`, `tokenName`, optional `ownerName` (switches to `revoke_body_staff`), `onConfirm`,
  `onCancel` and `submitting`.

Specs (`*Spec.js`): `groupScopes` ordering and unknown-family filtering, the status badge mapping,
each cell (including the null dates, the "All games" badge and the badge text) and the modal in
both variants.

## Files to Change

- `frontend/assets/js/components/common/api_tokens/ApiTokenScopes.js` (new)
- `frontend/assets/js/components/common/api_tokens/ApiTokenCellsHelper.jsx` (new)
- `frontend/assets/js/components/common/api_tokens/ApiTokenRevokeConfirmModal.jsx` and
  `helpers/ApiTokenRevokeConfirmModalHelper.jsx` (new)
- `frontend/assets/js/components/common/list_types/ApiTokenStatusBadges.js` (new)
- the matching specs under `frontend/specs/assets/js/components/common/` (new)
