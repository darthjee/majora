# Frontend Plan: Players should be able to update PC

Main plan: [plan.md](plan.md)

## Shared contracts

- Can rely on the backend producing `PATCH /games/:game_slug/pcs/:id.json`, accepting `name`,
  `role`, `public_description`, `money`, `links`, and returning the same `CharacterDetailSerializer`
  body the `GET` branch of this route already returns.
- Can rely on `character.can_edit`, `character.is_player`, `character.is_staff`, and
  `character.can_edit_money` already being present on the merged character object by the time the
  PC show/edit pages render (`CharacterAccessResolver.merge` in
  `frontend/assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js`
  already fetches and merges all four) — **no new backend field or fetch is needed** to implement
  this plan.
- `resolveVariant`/`RequestPermissionResolvers`/`pcConfig.js` already pick `full.json` when
  `can_edit` is true and the plain `.../pcs/:id.json` path otherwise (the `regular` variant) for
  any `PATCH` mutation on a PC — this plumbing needs no code change, only its stale docstring
  needs updating (see Step 5).
- Must not change anything under `frontend/assets/js/components/resources/character/pages/` that
  is NPC-specific (`npcShowType.js`, `NpcCharacterEditHelper.jsx`, `NpcPlayerEditPermission`-driven
  behavior) — this issue is PC-only.

## Implementation Steps

### Step 1 — Broaden the PC show page's Edit button

`frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx:73`
currently reads:

```jsx
<ConditionalComponent render={character.can_edit || (character.is_player && !character.is_pc)}>
```

The `!character.is_pc` clause exists solely to keep this NPC-only leniency from leaking to PCs.
Broaden it so a PC's Edit button also shows for any player of the game or any Staff account,
without changing NPC behavior at all:

```jsx
<ConditionalComponent
  render={character.can_edit || character.is_player || (character.is_pc && character.is_staff)}
>
```

(For an NPC, this reduces to the existing `can_edit || is_player`, byte-identical to today; for a
PC it additionally covers `is_player` unconditionally and `is_staff`.) Update the file's own JSDoc
for `character.is_player`/`character.is_staff` to mention this PC-side broadening.

### Step 2 — Broaden the PC edit page's access guard

`frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx:95` currently
reads:

```jsx
if (!character || (!character.can_edit && !character.is_player)) return EditHelper.renderLoading();
```

Broaden identically to Step 1's condition (again a no-op for NPCs):

```jsx
if (!character || (
  !character.can_edit && !character.is_player && !(character.is_pc && character.is_staff)
)) return EditHelper.renderLoading();
```

Leave `isFullEditor: character.can_edit` (line ~115) and the `submitForm` call's `character?.can_edit`
argument (line ~90) unchanged — `can_edit` correctly continues to mean "full editor" (dm/admin/
owner) for the purposes of endpoint selection and DM-notes gating; only the page-reachability
guard changes.

### Step 3 — Show `name`/`role` for a regular (non-full) PC editor

`frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js` currently
builds:

```js
const pcNameField = buildCharacterNameField(
  { edit: { id: 'pc-edit-name', labelKey: 'pc_edit_page.name_label' } },
  false,
);
...
const pcRoleField = buildCharacterRoleField(
  { edit: { id: 'pc-edit-role', label: 'pc_edit_page.role_label' } },
  false,
);
```

The trailing `false` is `alwaysShow` (see `CharacterNameSlot.jsx`/`CharacterRoleSlot.jsx`): it
currently means "hidden unless `isFullEditor`". Since the page is now reachable by a regular
(non-full) editor too (Step 2), and the new backend endpoint accepts both `name` and `role`, flip
both to `true` — mirroring exactly what `npcShowType.js` already does for its own `alwaysShow`
NPC fields, and safe specifically because the page-level guard from Step 2 already ensures nobody
without at least regular-editor rights ever reaches this form:

```js
const pcNameField = buildCharacterNameField(
  { edit: { id: 'pc-edit-name', labelKey: 'pc_edit_page.name_label' } },
  true,
);
...
const pcRoleField = buildCharacterRoleField(
  { edit: { id: 'pc-edit-role', label: 'pc_edit_page.role_label' } },
  true,
);
```

Update the two fields' own "PCs gate this on `isFullEditor`" JSDoc comments in
`CharacterNameSlot.jsx`/`CharacterRoleSlot.jsx` accordingly (they explicitly call out PCs as the
`false` case today).

`public_description` (`CharacterDescriptionSlot.jsx`) and `links` (`CharacterLinksSlot.jsx`) are
already unconditionally visible for both character kinds — no change needed for those two fields.

### Step 4 — Show the money field for a regular (non-full) PC editor

Unlike name/role, `buildCharacterMoneyField` (in `CharacterMoneySlot.jsx`) has no `alwaysShow`
parameter — it passes `isFullEditor` straight through to `CharacterMoneyField`/
`CharacterMoneyFieldHelper`, which hides the whole money block (breakdown + "Edit money" button)
unless `isFullEditor`. This gate must stay in place for NPCs (NPC money edits intentionally stay
admin/dm/staff-only, no player leniency — see `docs/agents/product.md`'s Editing Rules), so it
cannot simply be flipped like Step 3's `alwaysShow`.

Instead, reuse the `can_edit_money` field the character object already carries (`character.can_edit_money`,
from `CharacterDetailSerializer`, already correctly `true` for any player of a PC's game or any
Staff account per the pre-existing `CharacterMoneyEditPermission`, and correctly still
admin/dm/staff-only for an NPC):

1. In `CharacterEdit.jsx`'s `EditHelper.render(...)` call (~line 115), thread it through:
   ```js
   isFullEditor: character.can_edit,
   canEditMoney: character.can_edit_money,
   ...
   ```
2. In `CharacterMoneySlot.jsx`'s `buildCharacterMoneyField`, destructure the new prop and OR it
   in before passing to `CharacterMoneyField`:
   ```js
   return function CharacterMoneyEditOrNew({
     mode, isFullEditor, canEditMoney, money, treasureValue = 0, gameType, fieldErrors = {}, handlers,
   }) {
     const { label, button } = variants[mode];

     return (
       <CharacterMoneyField
         isFullEditor={isFullEditor || canEditMoney}
         ...
   ```
   (`canEditMoney` is simply `undefined`/falsy for the NPC "new" flow, which never sets it — no
   behavior change there.)

This keeps `CharacterMoneyField`/`CharacterMoneyFieldHelper` themselves untouched (still a single
`isFullEditor`-named prop), while making the *effective* value passed to them broader specifically
for a PC regular editor.

### Step 5 — Update `pcConfig.js`'s stale docstring

`frontend/assets/js/utils/requests/config/pcConfig.js`'s top-of-file docstring explicitly says the
`PATCH.single.regular` variant is "reserved for a future issue that adds player-writable PC
updates" and that "no PC caller reaches it today since the edit page redirects away when
`!can_edit`". Both statements are now false after Steps 1-4. Update the docstring to describe the
new reality: the endpoint now exists and is reachable, and to briefly note the new field-set split
(`full.json`: all fields; the plain endpoint: `name`/`role`/`public_description`/`money`/`links`).
No code change needed in this file itself — `patchRegular`/`patchPrivate` and the `PATCH.single`
export already point at the right paths.

### Step 6 — Tests

- `frontend/specs/.../CharacterHelper.spec.js` (or wherever `CharacterHelper.jsx` is currently
  spec'd): add cases for the broadened Edit button condition — a PC where `is_player` is true and
  `can_edit` is false shows the button; a PC where only `is_staff` is true shows the button; an
  NPC's existing behavior is unchanged.
- `CharacterEdit.spec.js`: add cases for the broadened access guard, mirroring the above.
- `pcShowType`-related specs (or the shared `PcCharacterEditHelper`/field slot specs): assert
  `name`/`role`/money field visibility for a non-full PC editor now render, and that
  `private_description` (DM notes) still does not.
- Confirm existing NPC specs for the equivalent fields are untouched/still passing (regression
  check).

## Files to Change

- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` —
  broaden the Edit button condition; update JSDoc.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — broaden
  the access guard; thread `canEditMoney` into `EditHelper.render`'s formState.
- `frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js` — flip
  `pcNameField`/`pcRoleField`'s `alwaysShow` to `true`.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterNameSlot.jsx` —
  JSDoc update only (PCs no longer gate on `isFullEditor`).
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterRoleSlot.jsx` —
  JSDoc update only.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterMoneySlot.jsx` —
  add/OR-in the `canEditMoney` prop.
- `frontend/assets/js/utils/requests/config/pcConfig.js` — docstring update only.
- Corresponding spec files under `frontend/specs/` mirroring each file above.

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `checks`)

## Notes

- No change is needed to `resolveVariant.js`, `RequestPermissionResolvers.js`, or `pcConfig.js`'s
  actual config objects — the binary "private if `can_edit` else regular" resolution already
  produces the right routing now that the regular endpoint is real.
- Double-check whether `BaseCharacterEditHelper`/`GameNpcNewHelper` (mentioned in some of the
  slots' JSDoc as the pre-migration precedent) still exist and need mirroring updates, or are
  already fully superseded by the `pcShowType`/`npcShowType` slot config — the JSDoc comments
  read as historical references, so this is a quick check, not necessarily a required change.
