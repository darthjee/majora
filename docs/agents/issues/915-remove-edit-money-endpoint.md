# Issue: Remove edit money endpoint

## Description
We have dedicated endpoints for editing PC/NPC money:
- `PUT /games/:game_slug/npcs/:id/money.json`
- `PUT /games/:game_slug/pcs/:id/money.json`

Money can also be edited through the regular PC/NPC PATCH endpoints:
- `PATCH /games/:game_slug/npcs/:id.json`
- `PATCH /games/:game_slug/pcs/:id.json`

For PCs, the `money` field is already writable through the regular PATCH endpoint. For NPCs, it currently is not — the NPC PATCH serializer explicitly excludes `money`.

## Problem
For PCs, the dedicated money endpoint is a true duplicate: both it and the regular PATCH endpoint resolve to the exact same permission set (`staff`, `player`, `owner`, plus admin/dm).

For NPCs, the dedicated money endpoint is not a pure duplicate today: it grants `staff` (plus admin/dm) the ability to edit money, while the regular PATCH endpoint only grants `player` (plus admin/dm) and cannot write `money` at all. Simply removing the dedicated endpoint would take away staff's only way to edit NPC money.

## Solution
- Remove the dedicated edit PC/NPC money endpoints:
  - `PUT /games/:game_slug/npcs/:id/money.json`
  - `PUT /games/:game_slug/pcs/:id/money.json`
- Remove the edit-money permission, relying on the existing PC/NPC edit permission instead.
- PC: no permission change needed — the regular PATCH permission already matches the money-edit permission.
- NPC:
  - Add `money` to the writable fields of the NPC PATCH serializer (`NpcPlayerUpdateSerializer`).
  - Broaden the NPC PATCH permission (`player_edit`) to also include `staff`, so staff keep the ability to edit NPC money (and, consistent with how PC staff access already works, gain full regular-edit access to NPCs — name, role, description, money, etc. — through the same PATCH endpoint).
- Frontend: keep the existing quick-edit money UX (`MoneyEditModal`, `can_edit_money`), but repoint its client call from `PUT .../money.json` to `PATCH .../:id.json`, and derive `can_edit_money` from the unified edit permission instead of a separate money-edit permission.

## Benefits
- Simplifies the API surface and permission model by removing a duplicated endpoint and permission.
- Removes the special-cased `money_edit` permission entirely, replacing it with a single, consistent edit permission per character type.
- NPC staff gain full edit capability via PATCH, consistent with how PC staff access already works today.
