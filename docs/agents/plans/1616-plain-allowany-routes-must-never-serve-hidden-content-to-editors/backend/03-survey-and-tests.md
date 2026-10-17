# Survey and regression tests

**Survey.** Check every remaining AllowAny GET view for role-dependent output: `request.user`,
`can_be_edited_by`, `is_superuser` or role checks that change the payload, or a hidden,
`incognito` or `private_*` exposure. Fix any further case in the same way as step 01. List the
result, including the deliberate per-viewer `access.json` / `permissions/*.json` endpoints, in
the PR description.

**Tests.**

- Update the existing tests that expect a superuser, dm or NPC editor to get `200` from a plain
  GET on a hidden NPC or hidden game treasure. They now expect `404`.
- Add one parametrized regression test: for every plain NPC GET in plan.md's contract, a hidden
  NPC returns `404` for anonymous, player, dm and superuser. For a hidden `GameTreasure`, the
  plain detail returns `404` for the dm as well.
- Keep (or add) tests showing an editor can still PATCH a hidden NPC through
  `npcs/<id>.json` and can still acquire/remove on it, since writes are unchanged.
- New routes: `photos/all.json` (anonymous 401, non-editor 403, editor 200 on a hidden NPC,
  `X-Skip-Cache` set, unknown id 404). `treasures/<id>/full.json` (anonymous 401, non-dm 403
  for both a hidden and a missing id, dm 200 with `hidden: true`, `X-Skip-Cache` set).

## Files to Change
- `backend/games/tests/views/game/npcs/...` — update and add tests
- `backend/games/tests/views/games/...` — game treasure detail/full tests
