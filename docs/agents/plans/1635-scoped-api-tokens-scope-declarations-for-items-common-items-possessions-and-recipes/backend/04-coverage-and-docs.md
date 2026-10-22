# Coverage list and docs

Remove the 27 declared URL names from `PENDING_TOKEN_SCOPES`: `game-items`, `game-items-all`,
`game-item-detail`, `game-item-detail-full`, `game-item-photo-upload`, `game-possessions`,
`game-possessions-all`, `game-possession-detail`, `game-possession-detail-full`,
`game-possession-photo-upload`, `game-common-items`, `game-common-items-all`,
`game-common-item-detail`, `game-common-item-detail-full`, `game-common-item-photo-upload`,
`game-common-item-recipes`, `game-common-item-recipes-all`, `game-recipes`, `game-recipes-all`,
`game-recipe-detail`, `game-recipe-detail-full`, `game-recipe-characters`,
`game-recipe-characters-all`, `permissions-game-item`, `permissions-game-common-item`,
`permissions-game-possession`, `permissions-game-recipe`. Keep the set (other families remain).

Update the **Status** paragraph of `token-scopes.md` to say the items, common items, possessions
and recipes families (with their photo upload inits, the common item → recipes and recipe →
characters listings, and their `permissions/game_*.json` routes) are declared (#1635), and
remove `#1635` from the list of remaining sub-issues. Optionally add a bullet under **Read
scopes** noting the recipe → common item output rule.

Run the full backend test suite (`docker-compose run --rm majora_tests pytest`); the coverage
test's `test_pending_entries_are_not_covered_or_excluded` guards against stale entries.

## Files to Change
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the 27 names
- `docs/agents/access-control/token-scopes.md` — update Status (and the recipe output rule)
