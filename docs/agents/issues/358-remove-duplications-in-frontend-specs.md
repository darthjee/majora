# Remove duplications in frontend/specs

## Context

`frontend/specs` (the Jasmine test suite) has significant code duplication in test setup, mock/fixture creation, and shared test-shape logic. This is the frontend-test counterpart to #357 (frontend/assets production code) and mirrors the backend pair #355/#356.

Four distinct kinds of duplication were found across `frontend/specs`:

1. **Pc/Npc spec pairs — largest block, ~1,850+ duplicated lines across 20+ file pairs**: every Pc*/Npc* spec file mirrors its counterpart almost verbatim, differing only by a mechanical find/replace (`Pc`→`Npc`, `pcs`→`npcs`, character name). Confirmed pairs include pages (`PcCharacterSpec.js`/`NpcCharacterSpec.js`, `PcCharacterEditSpec.js`/`NpcCharacterEditSpec.js`, `PcCharacterPhotosSpec.js`/`NpcCharacterPhotosSpec.js`, `PcCharacterTreasuresSpec.js`/`NpcCharacterTreasuresSpec.js`), controllers (`PcCharacterControllerSpec.js`/`NpcCharacterControllerSpec.js` and 5 more pairs, ~2,548 lines total), and helpers (`PcCharacterEditHelperSpec.js`/`NpcCharacterEditHelperSpec.js`, `PcCharacterPhotosHelperSpec.js`/`NpcCharacterPhotosHelperSpec.js`). Not every pc/npc-looking pair is a true duplicate: `GamePcsControllerSpec.js` (39 lines) vs `GameNpcsControllerSpec.js` (294 lines) is asymmetric because the Npc version also covers an NPC-only "create" flow — that pair should be left alone rather than force-merged.

2. **Repeated auth-header/fetch-mock boilerplate in client specs**: 12 files under `specs/assets/js/client/` (e.g. `CharacterClientSpec.js`, `GameClientSpec.js`, `TreasureClientSpec.js`, `AuthClientSpec.js`, `StaffUserClientSpec.js`) repeat the identical "sends the auth token when present" / "omits the Authorization header when there is no token" test pair and the identical `spyOn(globalThis, 'fetch')` + fake-`Response` mock setup. The `json: () => Promise.resolve(...)` mock-response shape appears 256 times across the whole spec suite with no shared helper building the fake response object.

3. **Existing factory infrastructure is completely unused**: `frontend/specs/support/factories.js` already defines `buildGame`, `buildCharacter`, and `buildLink`, but zero spec files import from `support/factories`. At least 52+ files that need character/game-shaped objects (fields like `profile_photo_path`, `is_pc`, `photos: []`) hand-roll inline literals instead — the frontend analogue of the backend's hand-rolled `Model.objects.create(...)` calls addressed in #356 via `factory_boy`.

4. **Repeated effect-neutralizing and loading-stub boilerplate**: 15 controller-consuming page specs repeat `spyOn(XController.prototype, 'buildEffect').and.returnValue(() => Noop.noop)` to neutralize `useEffect`, and 24 page specs repeat `spyOn(XHelper, 'renderLoading').and.returnValue(...)` as a "renders loading state" stub. `renderToStaticMarkup` from `react-dom/server` is used in 108 files with essentially the same render-and-assert-on-HTML-string pattern, suggesting a shared render-test helper is missing.

Dependency: the pc/npc spec merge (Photos/Treasures/detail) tests exactly the production components #357 plans to consolidate. That part of this issue should happen after (or alongside) #357's production merge, since the refactor will likely reshape what the specs need to cover; the other three areas (client fetch-mock helper, factories adoption, buildEffect/loading-stub helpers) do not depend on #357 and can proceed independently.

## What needs to be done

1. Wire up the existing `support/factories.js` (`buildGame`, `buildCharacter`, `buildLink`), extending it as needed, and migrate the 52+ files that hand-roll inline character/game/link fixtures to use it instead.
2. Extract shared spec helpers for recurring patterns: a fake-`Response`/fetch-mock builder for the client specs (replacing the 256 hand-built `json: () => Promise.resolve(...)` mocks and the repeated auth-header test pair across the 12 client spec files), and shared helpers for the `buildEffect`-neutralizing stub and `renderLoading` stub patterns repeated across 15/24 page specs respectively.
3. Once #357 lands its production-code merge of the Pc/Npc Character Photos/Treasures/detail components, use the new factories and shared helpers to merge the corresponding ~20 pc/npc spec file pairs (pages, controllers, helpers) into shared/parameterized specs, following the same approach used for whatever base component structure #357 introduces. Leave genuinely asymmetric pairs (e.g. `GamePcsControllerSpec.js`/`GameNpcsControllerSpec.js`) unmerged.
4. Keep this as a single issue covering factories + shared spec helpers + the pc/npc spec merge; the pc/npc merge sub-task should not start until #357's production merge is in place. Other sub-tasks can be broken out at planning/implementation time if needed.

## Acceptance criteria

- [ ] `support/factories.js` fixture builders (`buildGame`, `buildCharacter`, `buildLink`) are adopted across the specs that previously hand-rolled inline character/game/link fixtures.
- [ ] A shared fetch-mock/fake-`Response` helper replaces the duplicated mock setup and the repeated auth-header test pair in the client specs under `specs/assets/js/client/`.
- [ ] Shared helpers exist for the `buildEffect`-neutralizing stub and `renderLoading` stub patterns, and are adopted by the page specs that previously repeated them inline.
- [ ] Genuinely asymmetric pairs (e.g. `GamePcsControllerSpec.js`/`GameNpcsControllerSpec.js`) are left unmerged.
- [ ] Full frontend test suite passes after the refactor.
