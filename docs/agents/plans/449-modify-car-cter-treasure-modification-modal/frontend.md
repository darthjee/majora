# Frontend Plan: Improve Treasure Exchange Modal (Search, Sorting, Money Display, Button Rename)

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend's new `search` (both list endpoints) and `ordering` (acquire endpoint
only) query params described in [plan.md](plan.md)'s "Shared contracts". Also relies on
`GET /games/<game_slug>/pcs/<id>.json`'s already-returned `money` field (no backend change) for
the money display, and on the already-existing `TreasureMoney` component, which renders a full
denomination-breakdown string from a raw value.

## Implementation Steps

### Step 1 — Button rename
No code change: `CharacterTreasuresHelper.jsx:85-91` already renders the button via
`Translator.t('character_treasures_page.add_treasure')`. Only the translated value changes
(translator agent's job).

### Step 2 — `TreasureClient.fetchGameTreasuresPage`: `search` + `ordering`
`frontend/assets/js/client/TreasureClient.js` (`fetchGameTreasuresPage`, lines 93-103): destructure
and forward `search` and `ordering` the same way `maxValue` is handled today —
`if (search) search.set('search', search)` (careful with the local `search` `URLSearchParams`
variable name colliding with the new `search` param — rename one, e.g. keep the query-builder
variable as `queryParams`) and `if (ordering) queryParams.set('ordering', ordering)`.

### Step 3 — `CharacterClient.fetchTreasuresPage`: `search`
`frontend/assets/js/client/CharacterClient.js` (`fetchTreasuresPage`, lines 125-136): destructure
and forward `search` the same way, into the existing `URLSearchParams`.

### Step 4 — `TreasureExchangeModalController`: pass `search`/`ordering` through
`frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js`:
- `fetchAcquirePage(gameSlug, token, params)` and `fetchSellPage(gameSlug, characterId, isPc, token, params)`
  already forward their whole `params` object to the client calls — no signature change needed,
  just document (JSDoc) that `params` may now also include `search` (both) and `ordering`
  (acquire only).

### Step 5 — Search input + debounce + reset-to-page-1 in the modal
`frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx`:
- Add `const [search, setSearch] = useState('')`.
- Change `loadPage = (tab, page, searchTerm = search) => {...}` to include `searchTerm` in the
  `fetchAcquirePage`/`fetchSellPage` params, and pass `ordering: 'desc'` (always, unconditionally
  — there is no sort-direction UI toggle) when `tab === 'acquire'`.
- Reset `search` to `''` in the existing `show`-triggered effect (`useEffect(... [show])`,
  lines 95-103), alongside the other per-open resets.
- Add a debounced effect that re-runs `loadPage(activeTab, 1, search)` (always page 1, per the
  "reset to page 1 on new search" requirement) a short delay (e.g. 300ms) after `search`
  stops changing, guarding the very first render (when the modal isn't shown yet, or immediately
  after the `show` effect already fired page 1) with a `useRef` skip-first-run flag so it doesn't
  double-fetch on open — e.g. `const skipNextSearchEffect = useRef(true)` reset to `true`
  whenever the `show`/`activeTab` effects run, and consumed (set to `false` without fetching) on
  the debounce effect's first firing after each reset.
- Design decision (not specified by the issue): keep the `search` term when switching tabs via
  `handleTabChange` — only reset page to 1 there (already the case) — since a user is plausibly
  searching for the same treasure name regardless of tab. Flag this in code review if the
  product owner wants it reset per-tab instead.
- Pass `search`/`onSearchChange={setSearch}` down to `TreasureExchangeModalHelper.render`.

### Step 6 — Search input UI
`frontend/assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx`:
- In `#renderBrowsePane`, add a text `<input>` above `#renderPager`/`#renderBrowseList` (bound to
  `state.search`/`handlers.onSearchChange`), labelled via a new
  `treasure_exchange_modal.search_placeholder` translation key (translator agent).
- Extend the `render`/`#renderBrowsePane` JSDoc for the new `state.search`/`handlers.onSearchChange`.

### Step 7 — Money display at the top of the modal
`TreasureExchangeModalHelper.jsx`'s `render` (or a new `#renderMoney` helper called right after
`Modal.Header`, before the tabs): render
`<TreasureMoney value={character.money} gameType={gameType} />`, prefixed by a new
`treasure_exchange_modal.your_money` label key (translator agent). Requires threading `character`
(currently only `character.id`/`game_slug`/`is_pc`/`money` are read by `TreasureExchangeModal.jsx`
itself, not passed to the helper) into the `state` object passed to `TreasureExchangeModalHelper.render`.

### Step 8 — Refetch character data after every successful exchange
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterTreasuresController.js`:
  add a public `refreshCharacter()` method that re-derives `gameSlug`/`characterId` from
  `this.getParamsFromHash(this.client.currentHash())` and re-runs the same fetch as the private
  `#fetchCharacter` (extract the shared body into a private helper both `buildEffect()` and
  `refreshCharacter()` call). Guard the setters with a `this.#mounted` instance flag (set `true`
  in the constructor, `false` in `buildEffect()`'s cleanup) instead of `buildEffect()`'s
  closure-local `mounted`, since `refreshCharacter()` is called independently of that closure.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`:
  in `handleExchangeSuccess` (lines 43-46), replace the local
  `setCharacter((prev) => (prev ? { ...prev, money } : prev))` patch with
  `controller.refreshCharacter()`, so the money display (and any other character field) reflects
  a fresh fetch, per the issue's explicit "retrigger the character data load" requirement. Keep
  the `treasures` list merge (`mergeCharacterTreasureQuantity`) as-is — unrelated to money.

### Step 9 — Tests
- `TreasureClient/fetchGameTreasuresPageSpec.js` — add `search`/`ordering` param cases.
- `CharacterClient/fetchTreasuresPageSpec.js` — add a `search` param case.
- `TreasureExchangeModalSpec.js` — cover: debounced search triggers a page-1 refetch with the
  term on both tabs, `ordering: 'desc'` is only sent for the acquire tab, search term persists
  across a tab switch, `refreshCharacter()` (mocked) is called (not the old local money patch)
  after a successful acquire/sell.
- `TreasureExchangeModalHelper` specs — cover the new search input and money display rendering.
- A new/extended spec for `BaseCharacterTreasuresController` (or its PC/NPC subclasses' spec
  dirs) covering `refreshCharacter()`.
- `CharacterTreasuresSpec.js` — cover `handleExchangeSuccess` calling `controller.refreshCharacter()`.

## Files to Change
- `frontend/assets/js/client/TreasureClient.js` — `search`/`ordering` params.
- `frontend/assets/js/client/CharacterClient.js` — `search` param.
- `frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js` — JSDoc updates.
- `frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx` — search state/debounce, `ordering`, money prop threading.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx` — search input, money display.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterTreasuresController.js` — public `refreshCharacter()`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx` — call `refreshCharacter()` on exchange success.
- Spec files listed in Step 9.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).

## Notes
- The skip-first-run guard in Step 5 is the main risk spot — get it wrong and every modal open
  fires two acquire requests (the `show` effect's and the debounce effect's). Write the
  `TreasureExchangeModalSpec.js` case for "opening the modal fires exactly one acquire fetch"
  first, then implement against it.
- Whether search resets on tab switch (Step 5's design decision) is a judgment call, not
  something the issue specifies — flag for confirmation if it matters to the reporter.
