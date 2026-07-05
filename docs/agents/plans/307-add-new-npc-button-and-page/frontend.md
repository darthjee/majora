# Frontend Plan: Add new NPC button and page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `POST /games/<game_slug>/npcs.json` (produced by `backend`):

- Send JSON `{ name, role, public_description, private_description, hidden, money }` (only
  `name` required).
- `201` → response body is the created NPC's detail JSON (has `.id`); redirect to
  `#/games/:game_slug/npcs/:id`.
- `400` → response body `{"errors": {"<field>": [...]}}`; set as per-field errors.
- Any other non-ok status → generic error state.

Also relies on the existing `GameClient.fetchGameAccess(gameSlug, token)` → `{ can_edit }`
contract (no changes) to gate the "New NPC" button and the new page.

References new i18n keys that `translator` must add (see main `plan.md`): `game_npcs_page.new_npc`
and `game_npc_new_page.*` (`title`, `name_label`, `role_label`, `description_label`,
`private_description_label`, `hidden_label`, `money_label`, `submit`, `error`).

## Implementation Steps

### Step 1 — Add a `createNpc` client method

Add a method to `frontend/assets/js/client/CharacterClient.js`, following the existing
`updateNpc`/`#updateCharacter` pattern:

```js
createNpc(gameSlug, token, fields) {
  return this.request(`/games/${gameSlug}/npcs.json`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(fields),
  });
}
```

### Step 2 — Wire `canEdit`/`newHref` into the NPC index page only

This must **not** affect `GamePcs.jsx` (PC creation is out of scope) even though both pages
share `GameCharactersHelper`.

- `GameNpcsController.js`: add a `setCanEdit` constructor param (default `Noop.noop`) and a
  `GameClient` override param, then fetch access exactly like
  `GameSessionsController#fetchAccess` does (`gameClient.fetchGameAccess(gameSlug, token)` →
  `safeSet(this.setCanEdit, Boolean(access.can_edit))`, catching errors to `false`). Call it
  alongside the existing `#fetchNpcs` call inside `buildEffect()`.
- `GameNpcs.jsx`: add `canEdit` state + pass `setCanEdit` into the controller; compute
  `newHref = '#/games/${gameSlug}/npcs/new'`; pass `canEdit, newHref` through to
  `GameCharactersHelper.render(...)` as new trailing args.
- `GameCharactersHelper.jsx`: extend `render(...)` to accept optional `canEdit = false` and
  `newHref = ''` params. Wrap the existing `<BackButton href={backHref} />` in `PageActions`
  (same component `GameSessionsHelper` uses) so a `NewButton` can render alongside it when
  `canEdit` is true, using `Translator.t('game_npcs_page.new_npc')` as the label. Since
  `GamePcs.jsx` will keep calling `render(...)` without these two new trailing args, the
  button stays absent on the PC page (defaults keep it hidden) — this satisfies the issue's
  "PC creation stays out of scope" constraint without needing a `characterType` branch.
- While touching `GameNpcs.jsx`, also switch its hardcoded `'Non-Player Characters'` title
  string to `Translator.t('game_npcs_page.title')` if a natural, low-risk touch — otherwise
  leave it as-is if it risks scope creep on unrelated specs; use judgment, but the new
  `game_npcs_page` i18n namespace must exist regardless (translator step) since `new_npc` is
  required.

### Step 3 — Register the new route before the character-id route

In `frontend/assets/js/utils/HashRouteResolver.js`, add
`this.#router.register('/games/:game_slug/npcs/new', 'gameNpcNew');` **before** the existing
`this.#router.register('/games/:game_slug/npcs/:character_id', 'npcCharacter');` registration
(currently around line 30) — the router matches registration order, so "new" would otherwise
be captured as `character_id`. Wire the resolved `'gameNpcNew'` key to the new `GameNpcNew`
page component in `frontend/assets/js/components/helpers/AppHelper.jsx`, adding
`gameNpcNew: <GameNpcNew />,` next to the existing `gameSessionNew: <GameSessionNew />,`
entry.

### Step 4 — Add the New NPC page (mirror `GameSessionNew`)

Add three new files mirroring `GameSessionNew.jsx` / `GameSessionNewController.js` /
`GameSessionNewHelper.jsx`:

- `frontend/assets/js/components/pages/controllers/GameNpcNewController.js`:
  - Export `getGameSlugFromNpcNewHash(hash)` using
    `Router.extractParams('/games/:game_slug/npcs/new', hash)`.
  - Constructor: `(setError, setFieldErrors = Noop.noop, characterClient = null, gameClient = null)`.
  - `buildEffect()`: fetch game access via `gameClient.fetchGameAccess`, redirect to
    `#/games/:game_slug/npcs` when `!access.can_edit` (mirrors
    `GameSessionNewController#buildEffect` / `#redirectIfNotAllowed`).
  - `submitForm(event, gameSlug, formValues, setters)`: prevent default, reset
    status/fieldErrors, call `characterClient.createNpc(gameSlug, token, { name, role,
    public_description, private_description, hidden, money })`, then on `201` redirect to
    `#/games/:game_slug/npcs/:id` (parsed from the response body), on `400` set field errors,
    otherwise set `status = 'error'` — mirror `GameSessionNewController#submitForm` /
    `#handleResponse` exactly.
- `frontend/assets/js/components/pages/helpers/GameNpcNewHelper.jsx`: form with `FormField`s
  for name (required, text), role (text), description (likely `TextareaField` per the
  `npc_edit_page` pattern in `BaseCharacterEditHelper`), private description/DM notes
  (`TextareaField`), money (`type="number"`), plus a hidden-flag checkbox. There is no
  existing checkbox form element in `frontend/assets/js/components/elements/`; add a small
  inline `<div className="form-check">` block (label + `type="checkbox"` input bound to
  `checked`/`onChange`) directly in this helper rather than introducing a new shared
  component, unless a second use case for a shared checkbox appears.
- `frontend/assets/js/components/pages/GameNpcNew.jsx`: page component wiring controller +
  helper + local `name`/`role`/`description`/`privateDescription`/`hidden`/`money` state,
  mirroring `GameSessionNew.jsx`.

### Step 5 — Specs

Add Jasmine specs mirroring the existing `GameSessionNew*Spec.js` files for the new
controller, helper, and page component. Also update `GameNpcsControllerSpec.js` and any
`GameCharactersHelperSpec.js`/`GameNpcsSpec` for the new `canEdit`/`newHref` behavior, and add
a spec (or extend an existing one) asserting `GamePcs.jsx`'s render call is unaffected (no
button shown).

Run the full frontend dev cycle locally before committing:

```bash
docker-compose run --rm majora_fe yarn lint
docker-compose run --rm majora_fe yarn test
```

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `createNpc`
- `frontend/assets/js/components/pages/controllers/GameNpcsController.js` — add `canEdit` fetch
- `frontend/assets/js/components/pages/GameNpcs.jsx` — wire `canEdit`/`newHref`
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` — optional New button
- `frontend/assets/js/utils/HashRouteResolver.js` — register `npcs/new` route before `:character_id`
- `frontend/assets/js/components/helpers/AppHelper.jsx` — wire the `gameNpcNew` route key
- `frontend/assets/js/components/pages/controllers/GameNpcNewController.js` — new
- `frontend/assets/js/components/pages/helpers/GameNpcNewHelper.jsx` — new
- `frontend/assets/js/components/pages/GameNpcNew.jsx` — new
- Corresponding new/updated specs under `frontend/specs/assets/js/...`

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes

- Do not let the "New NPC" button leak onto `GamePcs.jsx` — verify by reading the final diff
  of `GameCharactersHelper.jsx` that PC rendering is unaffected when `canEdit`/`newHref` are
  omitted.
- Also update `AppHelper.jsx` per Step 3.
