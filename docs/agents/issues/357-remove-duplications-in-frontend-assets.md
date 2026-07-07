# Remove duplications in frontend/assets

## Context

`frontend/assets` contains duplicated production code (components, pages, controllers, helpers, and API clients) that should be reduced by extracting shared base classes, helpers, or utils responsible for single activities. This mirrors the backend duplication cleanup already tracked in #355/#356, but scoped to the frontend. Test files (Jasmine specs) are explicitly out of scope for this issue; if frontend test duplication is worth addressing, it will be tracked separately.

Three distinct kinds of duplication were found across `frontend/assets`:

1. **PC/NPC Character page trio (Photos, Treasures, detail) — largest block, ~1,000 lines**: `components/pages/{Npc,Pc}Character{,Photos,Treasures}.jsx`, their `controllers/{Npc,Pc}Character{Photos,Treasures}Controller.js`, and `helpers/{Npc,Pc}CharacterPhotosHelper.jsx` are near-byte-identical pairs. The only real differences are the literal `'npcs'`/`'pcs'` URL segments, i18n key prefixes (`npc_character_photos_page.*` vs `pc_character_photos_page.*`), and docstring wording. The sibling Edit page pair (`NpcCharacterEdit.jsx`/`PcCharacterEdit.jsx`) already solved this exact problem via a shared `CharacterEdit.jsx` + `BaseCharacterEditController`/`BaseCharacterEditHelper` parameterized by `characterKind` — that pattern was never applied to Photos/Treasures/detail. The base `NpcCharacter.jsx`/`PcCharacter.jsx` detail pages are slightly asymmetric (NPC adds a slain-confirm modal), so a shared base needs to accommodate that rather than assuming full symmetry.

2. **Repeated auth/JSON header boilerplate in `client/*.js` (~80 occurrences)**: every method across `GameClient.js`, `TreasureClient.js`, `StaffUserClient.js`, `CharacterClient.js`, `GameSessionClient.js`, `AuthClient.js`, and `GenericClient.js` hand-builds the same `Accept`/`Authorization`/`Content-Type` header object and, for writes, `JSON.stringify(fields)` inline, rather than going through a shared helper on `BaseClient.js` (which today only provides the generic `request()` wrapper plus skip-cache/activity logic). This is the frontend analogue of the backend's duplicated `_get` auth-header helper.

   Within `CharacterClient.js` specifically, 13 pc/npc method pairs (`fetchPc`/`fetchNpc`, `fetchPcFull`/`fetchNpcFull`, `updatePc`/`updateNpc`, `acquirePcTreasure`/`acquireNpcTreasure`, etc., ~200 of the file's 369 lines) are pure wrappers differing only in the `'pcs'`/`'npcs'` segment string passed to already-extracted private helpers (`#fetchCharacter`, `#updateCharacter`, etc.) — the private plumbing is de-duplicated, but the public API surface isn't.

3. **Edit-page controller skeleton repeated across 5 unrelated entities (~700 lines)**: `GameEditController.js`, `TreasureEditController.js`, `GameSessionEditController.js`, `StaffUserEditController.js`, and `GameTreasureEditController.js` share an identical control-flow skeleton (mount-guard + `safeSet`, parallel fetch of resource + access via `Promise.all`, `submitForm` calling the client then handling the response/redirect via `window.location.hash`). This one is same-shape rather than copy-paste: real behavioral differences exist (e.g. `TreasureEditController` gates on `AdminAccess.isSuperUser`, `GameEditController` doesn't), so any shared base needs parameterized hooks rather than a forced symmetric base — similar to how the backend's asymmetric pc/npc pairs were handled in #355.

CSS/SCSS (`main.scss`, `styles.css`) was checked and has no significant duplication — out of scope.

## What needs to be done

1. Extend the existing `CharacterEdit.jsx` + `BaseCharacterEditController`/`BaseCharacterEditHelper` pattern (already used for the Edit page pair, parameterized by `characterKind`) to the Photos, Treasures, and detail page trio, consolidating the 6 near-identical page/controller/helper file pairs into shared bases while accommodating the NPC-only slain-confirm modal asymmetry.
2. Add shared header-building helpers to `BaseClient.js` (e.g. `getJson`/`postJson`/`patchJson`) and migrate `GameClient.js`, `TreasureClient.js`, `StaffUserClient.js`, `CharacterClient.js`, `GameSessionClient.js`, `AuthClient.js`, and `GenericClient.js` to use them instead of hand-building auth/JSON headers inline.
3. In `CharacterClient.js`, collapse the 13 pc/npc public method pairs (`fetchPc`/`fetchNpc`, `updatePc`/`updateNpc`, etc.) into parameterized methods (taking a pc/npc kind), consistent with how the backend consolidated its own pc/npc pairs.
4. Extract a shared base/parameterized skeleton for the 5 Edit-page controllers (`GameEditController.js`, `TreasureEditController.js`, `GameSessionEditController.js`, `StaffUserEditController.js`, `GameTreasureEditController.js`), covering the common mount-guard/fetch-with-access/submit-and-redirect flow, with hooks for entity-specific behavior (e.g. superuser gating in `TreasureEditController`).
5. Keep this as a single issue covering all three areas; sub-tasks can be broken out at planning/implementation time if needed.

This removes roughly 1,900+ lines of duplicated frontend code across pages, controllers, helpers, and API clients; establishes a reusable pattern for future pc/npc-style and entity-edit-style features; and brings the frontend in line with the de-duplication already applied to its backend counterpart (#355/#356).

## Acceptance criteria

- [ ] Photos, Treasures, and detail pc/npc page/controller/helper pairs are consolidated into shared bases (analogous to the existing `CharacterEdit`/`BaseCharacterEditController`/`BaseCharacterEditHelper` pattern), accommodating the NPC-only slain-confirm modal.
- [ ] `BaseClient.js` provides shared JSON/auth header helpers, and `GameClient.js`, `TreasureClient.js`, `StaffUserClient.js`, `CharacterClient.js`, `GameSessionClient.js`, `AuthClient.js`, and `GenericClient.js` are migrated to use them.
- [ ] `CharacterClient.js`'s 13 pc/npc public method pairs are collapsed into parameterized methods.
- [ ] The 5 Edit-page controllers share a common base/skeleton with hooks for entity-specific behavior (e.g. superuser gating).
- [ ] Existing Jasmine specs (excluded from this issue's scope for rewriting) still pass against the refactored code.
