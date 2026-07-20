# Frontend Plan: Add PC item creation

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the endpoint request/response shape and
the new `can_create_item` field on `/permissions.json`. This file only expands on where to
consume them.

## Implementation Steps

### Step 1 — Routes

Add two new routes to `frontend/assets/js/utils/routing/HashRouteResolver.js`'s `ROUTES` table,
each placed immediately **before** its corresponding existing `.../items` entry (more specific
path first, matching the existing `.../edit` and `/new` placement convention elsewhere in this
table):

```js
['/games/:game_slug/npcs/:character_id/items/new', 'npcCharacterItemNew'],
['/games/:game_slug/npcs/:character_id/items', 'npcCharacterItems'],
...
['/games/:game_slug/pcs/:character_id/items/new', 'pcCharacterItemNew'],
['/games/:game_slug/pcs/:character_id/items', 'pcCharacterItems'],
```

### Step 2 — New page components

Add `PcCharacterItemNew.jsx`/`NpcCharacterItemNew.jsx` (or one shared component parameterized by
`characterKind`, following `CharacterItemsHelper`'s existing PC/NPC-sharing precedent) under
`frontend/assets/js/components/resources/character/pages/`, following the `GameNpcNew.jsx` /
`GameNpcNewController.js` / `GameNpcNewHelper.jsx` three-file shape:

- **Page component**: reads `game_slug`/`character_id` from the current hash (via
  `BasePageController.extractParams`, same as `PcCharacterItems.jsx`), holds form state via
  `useFormState({ name: '', description: '', hidden: false })`, wires `onSubmit` to the
  controller.
- **Controller**: extends `BasePageController`. `buildEffect()` should check the character-level
  permission before allowing the page to render — reuse the existing
  `AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId)` call already used
  by the items list (Step 3's `fetchList`), redirecting to the items list page when
  `can_create_item` is `false` (mirrors `GameNpcNewController#buildEffect`'s
  `ensureGamePermissions`/redirect-on-`can_edit`-false pattern, but checking `can_create_item`
  instead of `can_edit`). `submitForm` posts to the new client method (Step 4) and, on `201`,
  redirects to the items list page (`#/games/${gameSlug}/${characterKind}/${characterId}/items`)
  — there is no per-item detail page to redirect to (`listTypeConfig`'s `pc-items`/`npc-items`
  entries use `buildItemHref: buildNullItemHref`). On `400`, set field errors the same way
  `GameNpcNewController#handleResponse` does.
- **Helper**: renders `name` via `FormField` (`type="text"`), `description` via the existing
  `CharacterDescriptionField` (already a generic labeled-textarea component, not PC/NPC-specific
  despite living under `character/pages/elements/`), and `hidden` via the same raw
  `form-check form-switch` checkbox markup `GameNpcNewHelper` already uses (no reusable `<Switch>`
  component exists in this codebase) — no avatar/links/money fields needed, this form is just the
  three fields from the issue.

### Step 3 — `can_create_item` gating on the list page

`CharacterItemsHelper` (`frontend/assets/js/components/resources/character/pages/helpers/
CharacterItemsHelper.jsx`) currently renders no action button ("Read-only: no 'New'/'Add' action").
Add a "Create Item" button, following `GameTreasuresHelper#renderNewButton`'s pattern: a
`NewButton` linking to `#/games/${gameSlug}/${characterKind}/${characterId}/items/new`, rendered
only when permitted.

The permission source needs a small change: `ListPage`'s `onCanEditChange` (consumed today via
`PcCharacterItems`/`NpcCharacterItems` → `CharacterItemsHelper`) reflects `pc-items`/`npc-items`
list type's underlying `AccessStore.ensureCharacterPermissions` call, which resolves `can_edit`
(no staff bypass) — not the new `can_create_item`. Two ways to thread `can_create_item` through
instead, pick whichever keeps `ListPage`'s generic contract cleanest:
- Have `CharacterItemsHelper`'s owning pages (`PcCharacterItems`/`NpcCharacterItems`) call
  `AccessStore.ensureCharacterPermissions` themselves (independent of `ListPage`) to read
  `can_create_item` directly, passing it down as a new prop, or
- Extend `AccessStore.ensureCharacterPermissions`'s resolved shape to include `can_create_item`
  alongside whatever it already exposes, and thread it through `ListPage`'s existing
  `onCanEditChange` callback under a new `onCanCreateItemChange` (or similar) callback.

Check `AccessStore.ensureCharacterPermissions`'s current return shape/caching before choosing —
it likely already fetches the full `/permissions.json` payload, so `can_create_item` may already
be present in its resolved object.

### Step 4 — Client method

Add a creation method to `frontend/assets/js/client/CharacterClient.js`, following the
`createNpc` precedent:

```js
createItem(characterKind, gameSlug, characterId, token, fields) {
  return this.postJson(
    `/games/${gameSlug}/${characterKind}/${characterId}/items.json`, token, fields,
  );
}
```

### Step 5 — i18n

Add translation keys for the new page (title, field labels, submit button, error message) under
whatever i18n namespace matches `character_items_page`'s sibling convention (e.g.
`character_item_new_page` or similar — check `frontend/assets/i18n/` for the exact existing key
style) to every language file, per `docs/agents/i18n.md`.

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — two new routes.
- `frontend/assets/js/components/resources/character/pages/PcCharacterItemNew.jsx` /
  `NpcCharacterItemNew.jsx` (or one shared parameterized component) — new page component(s).
- `frontend/assets/js/components/resources/character/pages/controllers/
  CharacterItemNewController.js` (or per-kind) — new controller.
- `frontend/assets/js/components/resources/character/pages/helpers/
  CharacterItemNewHelper.jsx` — new form-rendering helper.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx` —
  add the "Create Item" button.
- `frontend/assets/js/components/common/access/store/AccessStore.js` (path approximate — locate
  the actual file) — thread `can_create_item` through, per Step 3.
- `frontend/assets/js/client/CharacterClient.js` — add `createItem`.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the new page component(s), same
  as the existing `gameNpcNew`/`pcCharacterItems` entries.
- `frontend/assets/i18n/*.yml` (or equivalent) — new translation keys, all languages.
- Specs (mirror the above under `frontend/specs/`): new page/controller/helper specs, plus updates
  to the existing `CharacterItemsHelper`, `AccessStore`, and `CharacterClient` specs.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).

## Notes

- Confirm during implementation whether `AccessStore.ensureCharacterPermissions` already caches/
  exposes the full `/permissions.json` payload (in which case `can_create_item` needs no new
  fetch, just reading one more key) or only projects out `can_edit` today (in which case its
  return shape needs widening) — this determines exactly how much of Step 3 is new vs. already
  available.
- No photo field, and no picker to link an existing `GameItem` — both explicitly out of scope
  (see [plan.md](plan.md)).
