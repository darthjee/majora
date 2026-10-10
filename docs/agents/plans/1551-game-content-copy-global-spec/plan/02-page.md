# Write `page.md`

Describe the staff page, from the issue's `game-content-copy/page.md` section and the
cross-domain game scope from its permissions section.

- Admin menu entry: a new `adminItem` in `HeaderNavHelper.jsx` (`IS_ADMIN` gate), route
  `#/staff/copies?type=<tab>&from=<slug>&to=<slug>`, i18n keys.
- Source/target game selectors fed by `GET staff/copies/games.json` (every game across domains,
  with its domain groups); same game for both rejected; both kept in the URL across tab switches.
- Tabs modeled on `StaffPhotoTabs` (`GET staff/copies.json` lists them): Items, Common items,
  Recipes, Documents, Factions, Possessions.
- Source list with checkboxes and the `copied_to_target` flag; re-copy asks for confirmation.
- Execution: one copy request per selected entity, then that entity's link requests; per-entity
  result and per-file progress; one failure never affects the others.
- Pending/failed links list (`GET staff/copies/links.json?to=<slug>`) with error reasons and a
  retry action (renew + link); no discard.

## Files to Change

- `docs/agents/specs/game-content-copy/page.md` — new.
