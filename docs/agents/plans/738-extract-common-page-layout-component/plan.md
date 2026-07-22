# Plan: Extract common page layout component

Issue: [738-extract-common-page-layout-component.md](../../issues/738-extract-common-page-layout-component.md)

## Overview

Generalize the existing list-page pattern (`ListPage` + `listTypeConfig`, under
`frontend/assets/js/components/common/list_page/` and `common/list_types/`) into an equivalent
pattern for show/new/edit pages: a shared `ShowPageLayout` component plus a per-resource-type
`showTypeConfig` registry, so every affected page wires up the shared layout instead of
hand-rolling its own left/right column markup. This replaces three narrower, ad hoc sharing
mechanisms that already exist (`CharacterDetail`/`CharacterHelper`, `PlayerDetail`,
`ItemDetailHelper`) with one generic mechanism, and fixes a live inconsistency where hidden NPCs
are dimmed on the list page but not on their own show/new/edit pages. See [plan_pages.md](plan_pages.md)
for the per-resource-type migration breakdown.

## Context

Today, `ListPage`/`listTypeConfig` (`common/list_page/ListPage.jsx`,
`common/list_types/listTypeConfig.js`) already implement this pattern for index pages: a type
config declares `fetchList`, `photoType`, `buildActionBarProps`, `buildInfoBarItems`, etc., and
the owning page only renders `<ListPage type="..." .../>`.

Show pages have no equivalent generic mechanism yet — only type-specific narrow sharing:
- `CharacterDetail.jsx` + `CharacterHelper.jsx` — shared between `PcCharacter`/`NpcCharacter`,
  takes a `ControllerClass` prop rather than a `type` key.
- `PlayerDetail.jsx` — mirrors `CharacterDetail`'s plumbing for the player page.
- `ItemDetailHelper.jsx` — shares only the *rendering*, not the page/controller shell, across
  `GameItem`, `PcCharacterItem`, `NpcCharacterItem`.
- `GameHelper.jsx` (game show) and every `*New`/`*Edit` helper (`GameNewHelper`,
  `GameNpcNewHelper`, `GameEditHelper`, `TreasureEditHelper`, `ItemEditHelper`, ...) each
  hand-roll their own `container mt-4` / `row` / `col-md-4` / `col-md-8` markup independently.

Confirmed scope decisions from issue discussion:
- The shared config mechanism covers **show, new, and edit** pages for each resource type (not
  just read-only show pages).
- This same issue **fixes** the hidden-NPC dimming gap: `characterListTypes.js`'s
  `buildNpcActionBarProps` sets both `grayscale` (slain) and `dimmed` (hidden) for the list page,
  but `CharacterAvatarHelper.render` (show page) only ever passes `grayscale` — never `dimmed`.
  `ActionsOverlay` already supports `dimmed` (`common/misc/ActionsOverlay.jsx:44,47`, CSS class
  `photo-hidden`, `opacity: 0.6` in `assets/css/main.scss:152-154`); it just isn't wired on the
  character show/new/edit avatar today (`GameNpcNewHelper` already does wire it correctly on the
  NPC creation form, `GameNpcNewHelper.jsx:117` — the show/edit pages are the ones missing it).
- All 19 routes listed in the issue are migrated as part of this same effort (not spun off into
  follow-ups), broken into resource-type phases for manageable review (see
  [plan_pages.md](plan_pages.md)).

### Architecture design

New files under `frontend/assets/js/components/common/show_page/` (mirroring
`common/list_page/`'s shape):

- **`ShowPageLayout.jsx`** — a pure, stateless rendering component (no fetch/loading/error state
  of its own, unlike `ListPage`). Props: `type` (key into `showTypeConfig`), `mode`
  (`'show'|'new'|'edit'`), `backHref`, `pageActions` (children rendered inside `PageActions`,
  e.g. an Edit button on show, a Submit button on new/edit), `context` (the show page's fetched
  entity data, or the new/edit page's `formState`, plus `handlers` and any per-page extras like
  `gameSlug`/`canEdit`). Renders:
  ```
  <div className="container mt-4">
    <PageActions backHref={backHref}>{pageActions}</PageActions>
    <div className="row">
      <div className="col-md-4">{left-slot components from showTypeConfig[type]}</div>
      <div className="col-md-8">{right-slot components from showTypeConfig[type]}</div>
    </div>
    {bottom-slot components from showTypeConfig[type]}
  </div>
  ```
  When `mode !== 'show'`, the whole body is wrapped in `<form onSubmit={context.handlers.onSubmit}>`
  in place of the plain `div`, matching every existing `*New`/`*Edit` helper's top-level markup.
- **`show_types/showTypeConfig.js`** (+ `show_types/configs/*.js`, split per resource the same
  way `list_types/configs/*.js` is split to respect the project's max-lines lint limit) — one
  entry per resource type (`game`, `pc`, `npc`, `game-item`, `pc-item`, `npc-item`, `treasure`,
  ...), each declaring:
  - `left`, `right`, `bottom` — arrays of components. Each component is used as-is inside its
    slot and is responsible for its own show/hide logic (per the issue: "the components ...
    should handle the logic if they will or will not appear/render"). Where a resource needs a
    different component per mode (e.g. `CharacterAvatar` read display vs. `CharacterAvatarField`
    form input), the slot entry is `{ Show: CharacterAvatar, New: CharacterAvatarField, Edit: CharacterAvatarField }`
    and `ShowPageLayout` picks the one matching the current `mode` (falling back to `Show` when a
    mode-specific variant isn't declared, e.g. simple resources like Game/Treasure `new` pages
    that have no natural left-side content just omit `left` entirely for those modes).
  - `photoType`, `buildActionBarProps(data, context)`, `buildInfoBarItems(data, context)` — reused
    verbatim from the list-page precedent (`listTypeConfig`'s own fields of the same name),
    so the same builder functions can be shared between a resource's list and show configs where
    the visual rule is identical (e.g. hidden ⇒ `dimmed`, slain ⇒ `grayscale`).
  - `buildBackHref(context)`, `buildEditHref(context)` — hash path builders, replacing the
    inline template strings duplicated in every current `*Helper.render`.

**Scoping note on data-fetching**: only the *layout* (which components render in which slot, and
the shared action-bar/info-bar/photo-transparency plumbing) is unified across show/new/edit.
Data-fetching, form state, and submission stay owned by each page's existing
controller/hook, exactly as `listTypeConfig`'s `fetchList` already stays per-type rather than
folding into `ListPageController`. Concretely: `ShowPage.jsx` (the show-mode entry point,
replacing `CharacterDetail`/ad hoc show pages) owns loading/error/effect state the same way
`ListPage` does today, calling a per-type `fetchShow(gameSlug, hashResolver, client?)` — but the
`*New`/`*Edit` pages keep their existing controllers/hooks for form state and submission, and
simply render through `ShowPageLayout` instead of their own bespoke markup. Forcing new/edit's
submit flow into a generic fetch-controller would be over-engineering a data flow that isn't
actually shared today.

## Progress

- **Done** (PR landing Steps 1-2): `ShowPageLayout` + `showTypeConfig` registry built, and the
  `game` resource (`Game`/`GameNew`/`GameEdit`) migrated onto it, with specs. Implementation
  detail that superseded the design sketch below: slot entries use **exact mode matching, no
  implicit fallback-to-`Show`** — an object entry (`{Show, New, Edit}`) renders nothing for a
  mode it doesn't declare a key for. This avoided a real bug in the `game` migration (e.g. the
  next-session block and open-polls widget are show-only and must render nothing on the edit
  page, which a "fallback to Show" default would have gotten wrong). Update this note if a later
  phase reintroduces a fallback.
- **Done** (Step 3): `item` (game/pc/npc-scoped) migrated onto a single shared `item` entry in
  `showTypeConfig` — `game-item`, `pc-item`, and `npc-item` collapsed into one config, since their
  layout and fields are identical (confirming the "confirm during implementation" note in
  `plan_pages.md`). Replaces `ItemDetailHelper`'s/`ItemEditHelper`'s/`CharacterItemNewHelper`'s
  hand-rolled markup with `ShowPageLayout` + `elements/show/*.jsx` slot components, with specs for
  every new slot component and the `item` config itself. There is no `game-item` creation flow
  (confirmed against `HashRouteResolver.js` — only `pcCharacterItemNew`/`npcCharacterItemNew`
  routes exist), so `ItemPhoto` has no `New` variant and the `New` title/name/description/hidden
  slots are only ever reached from the PC/NPC item creation route.
- **Remaining** (Steps 4-6, not yet started): `pc`/`npc` (characters, incl. the hidden→`dimmed`
  fix), `treasure`, then removing the now-superseded `CharacterDetail`/`CharacterHelper`/
  `ItemDetailHelper`. Given the size, land each as its own follow-up PR against this same issue,
  same as the `game`/`item` phases.

## Implementation Steps

### Step 1 — Build the shared layout + empty registry

Create `common/show_page/ShowPageLayout.jsx` and `common/show_page/show_types/showTypeConfig.js`
(empty registry to start), following the design above. Add Jasmine specs under
`frontend/specs/.../common/show_page/` covering: left/right/bottom slot rendering, per-mode
component selection (`Show`/`New`/`Edit` variants, including the fallback-to-`Show` case), the
`<form>` wrapper only appearing in new/edit mode, and an empty slot rendering nothing.

### Step 2 — Prove it out on `game` (simplest resource)

Migrate `Game`/`GameNew`/`GameEdit` to `ShowPageLayout` + a `game` entry in `showTypeConfig`
(see [plan_pages.md](plan_pages.md) for the exact slot breakdown). This resource has no
avatar/dimming/action-bar complexity, so it validates the layout mechanism itself before tackling
harder cases. Update existing specs for `GameHelper`/`GameNewHelper`/`GameEditHelper` (or their
replacements) to assert against the new render tree; behavior (visible text, links, form fields)
must stay identical.

### Step 3 — Migrate `item` (game/pc/npc-scoped)

Extend `showTypeConfig` with `game-item`, `pc-item`, `npc-item` entries, replacing
`ItemDetailHelper` and each of `GameItem`/`PcCharacterItem`/`NpcCharacterItem`'s show pages, plus
their `*New`/`*Edit` counterparts. This resource is a good second step: already partially shared
(`ItemDetailHelper`), no allegiance/slain complexity, but does have the hidden→dimmed rule to
carry over consistently for items too (`ItemCardHelper.buildInfoBarItems` already handles the
info badge; confirm whether items need `dimmed` photo treatment or only the existing info badge —
check `ItemCardHelper`/`ActionsOverlay` usage on the list page for parity).

### Step 4 — Migrate `pc`/`npc` (characters — most complex)

Replace `CharacterDetail`/`CharacterHelper`, `PcCharacterEdit`/`PcCharacterEditHelper`,
`NpcCharacterEdit`/`NpcCharacterEditHelper`, `GameNpcNewHelper` (there is no `GamePcNew` — PCs
are not created via this flow, confirm during implementation) with `pc`/`npc` entries in
`showTypeConfig`. This phase:
- Carries over `photoType: 'avatar'`, `buildActionBarProps` (slain/revive secondary buttons via
  `SlainSecondaryButtons`, matching `CharacterAvatarHelper.#buildSecondaryButtons`), and
  `buildInfoBarItems` (`InfoBarRules.build`).
- **Fixes the dimming gap**: the show-mode (and edit-mode) avatar action-bar builder must pass
  `dimmed: character.hidden` (or the equivalent field name returned by the character detail
  endpoint — confirm the exact field, since `CharacterAvatarHelper` currently reads
  `character.slain` for `grayscale` but never reads a `hidden`-driven `dimmed`; cross-check
  against `characterListTypes.js`'s `buildNpcActionBarProps` for the field name it reads).
- Left slot: avatar (mode-aware: `CharacterAvatar` / `CharacterAvatarField`), name, links, money
  (mode-aware: `CharacterMoney` / `CharacterMoneyField`), NPC-only allegiance border wrapper.
- Right slot: role, description, DM notes (each mode-aware read/field pair), plus the three
  `PreviewSection`s (treasures/items/documents) — show-mode only, no field equivalent.
- Bottom slot: `CharacterPhotosPreview` — show-mode only.
- NPC-only extras (slain modal, allegiance/public-allegiance fields) stay as NPC-specific
  additions layered on top of the shared `pc`/`npc` configs (mirroring how `CharacterDetail`'s
  `useExtra` hook already isolates NPC-only behavior from PC).

### Step 5 — Migrate `treasure`

Replace `Treasure` show/`TreasureNew`/`TreasureEdit` (and the game-scoped
`GameTreasureEdit`/`GameTreasureEditHelper` variant) with a `treasure` entry in `showTypeConfig`,
reusing `TreasureCardHelper`'s existing info-bar builder the same way the list-page `treasures`
type config already does.

### Step 6 — Remove dead code

Once every affected page (see [plan_pages.md](plan_pages.md)) has been migrated, delete the
now-unused `CharacterDetail.jsx`, `CharacterHelper.jsx`, `ItemDetailHelper.jsx`, and any
`*Helper.jsx` render methods fully superseded by `showTypeConfig` entries. Leave `PlayerDetail.jsx`
alone — the player show page is not in the issue's affected-pages list and has no new/edit
counterpart, so migrating it is out of scope for this issue.

## Files to Change

Representative files (see [plan_pages.md](plan_pages.md) for the full per-resource list):

- `frontend/assets/js/components/common/show_page/ShowPageLayout.jsx` — new, the shared layout shell
- `frontend/assets/js/components/common/show_page/show_types/showTypeConfig.js` — new, registry
- `frontend/assets/js/components/common/show_page/show_types/configs/*.js` — new, one file per
  resource type (`gameShowType.js`, `characterShowTypes.js`, `itemShowTypes.js`,
  `treasureShowType.js`)
- `frontend/assets/js/components/resources/game/pages/{Game,GameNew,GameEdit}.jsx` and their
  `helpers/*Helper.jsx` — migrated to `ShowPageLayout`
- `frontend/assets/js/components/resources/item/pages/{GameItem,GameItemEdit}.jsx`,
  `resources/character/pages/{PcCharacterItem,PcCharacterItemEdit,NpcCharacterItem,NpcCharacterItemEdit}.jsx`,
  `item/pages/helpers/ItemDetailHelper.jsx` (removed) — migrated
- `frontend/assets/js/components/resources/character/pages/{PcCharacter,NpcCharacter,PcCharacterEdit,NpcCharacterEdit,GameNpcNew}.jsx`,
  `character/pages/shared/CharacterDetail.jsx` (removed), `character/pages/helpers/{CharacterHelper,GameNpcNewHelper,PcCharacterEditHelper,NpcCharacterEditHelper}.jsx`,
  `character/pages/elements/helpers/CharacterAvatarHelper.jsx` (dimming fix) — migrated
- `frontend/assets/js/components/resources/treasure/pages/{Treasure,TreasureNew,TreasureEdit,GameTreasureEdit}.jsx`
  and their helpers — migrated
- `frontend/specs/**` — new specs for `ShowPageLayout`/`showTypeConfig`, updated specs for every
  migrated page/helper

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs the Jasmine suite; every migrated
  page's existing spec must keep passing (updated for the new render tree) since this is a pure
  refactor with no intended behavior change beyond the dimming fix
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no new translation keys are
  expected (existing i18n keys are reused as-is), but run this if any are touched

## Notes

- **"Same config mechanism" for new/edit** is interpreted as sharing the *layout shell and slot
  configuration*, not a shared data-fetching/submission controller — data-fetch and form-submit
  logic remain per-page, exactly as `listTypeConfig`'s `fetchList` already stays per-type rather
  than centralizing into `ListPageController`. Flag this interpretation to the user/reviewer if a
  different unification (e.g. a single generic form controller) turns out to be expected.
- Given the size (~19 routes across 4 resource kinds), land this as multiple PRs — one per phase
  in "Implementation Steps" — rather than one giant diff, even though this plan covers the full
  scope in one issue.
- Confirm the exact API field name for "hidden" on the character detail/edit payloads before
  wiring `dimmed` (cross-check `characterListTypes.js`'s `buildNpcActionBarProps` — it may be
  `character.hidden` or a differently-named field on the detail endpoint vs. the list endpoint).
- `PlayerDetail`/`PlayerHelper` is intentionally left out of scope (not in the issue's affected
  pages list, and has no new/edit counterpart to justify the shared new/edit slot mechanism).
