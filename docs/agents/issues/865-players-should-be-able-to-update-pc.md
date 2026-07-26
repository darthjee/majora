# Issue: Players should be able to update PC

## Problem
Today a Player Character (PC) can only be fully edited via `PATCH /games/:game_slug/pcs/:id/full.json`, gated by `CharacterEditPermission`: the game's superuser/admin, a GameMaster (dm), or the PC's own owning player. The plain `PATCH /games/:game_slug/pcs/:id.json` route does not exist yet — it is `GET`-only today (a `PATCH` 404s/405s), though `frontend/assets/js/utils/requests/config/pcConfig.js` already has a placeholder config entry for it, explicitly reserved for "a future issue that adds player-writable PC updates".

On the frontend, the PC show page's Edit button (`CharacterHelper.jsx`) and the PC edit page's access guard (`CharacterEdit.jsx`) are both gated on the same narrow `can_edit` (owner/dm/superuser) — so today no other player of the game, and no Staff account, can reach any PC editing at all. This is unlike NPCs (which already have a narrower player-writable `PATCH` for a subset of fields) and unlike the PC `money.json`/photo-upload endpoints (which already grant Staff and any player of the game a narrower carve-out).

## Expected Behavior
- The PC show page's Edit button, and the PC edit page (`/#/games/:game_slug/pcs/:id/edit`), are both reachable by: dm, admin, staff, the PC's owning player, and any other player of the game.
- The edit page/form shows the **full field set** (name, role, public_description, private_description, hidden, money, allegiance, public_allegiance, links) only to dm, admin, and the PC's owning player. Any other player of the game, and any Staff account, see a **reduced form** instead — only name, role, public_description, links, and money — with private_description, hidden, and allegiance fields hidden entirely (not just disabled).
- `PATCH /games/:game_slug/pcs/:id/full.json` (the existing "private"/full endpoint) keeps its current permission and field set unchanged: accessible only to dm, admin, and the PC's owning player.
- `PATCH /games/:game_slug/pcs/:id.json` (the "regular" endpoint, new) is accessible to dm, admin, the PC's owning player, any other player of the game, and staff — and only accepts: name, role, public_description, links, and money.

## Solution
- Add a new PATCH view/route for `pcs/:id.json`, accepting only `name`, `role`, `public_description`, `links`, and `money`, gated by a new permission class shaped like the existing `CharacterMoneyEditPermission` (superuser/dm/owner, plus Staff, plus any player of the game — PC-only).
- Leave `full.json`'s permission (`CharacterEditPermission`) and field set exactly as they are today — no change there.
- Update the PC show page's Edit button and `CharacterEdit.jsx`'s access guard to open for any player of the game and for Staff, not just `can_edit`.
- Update the PC edit form/submit logic so a full editor (dm/admin/owner) still sees and submits the full field set against `full.json`, while any other player of the game or Staff see and submit only the reduced field set against the new `pcs/:id.json` endpoint.
