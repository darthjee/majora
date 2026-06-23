# Frontend plan — issue #111 (add edit NPC page)

See [plan.md](plan.md) for the shared contract. This largely mirrors #110's frontend work
(`PcCharacter*`/`CharacterClient`), now extended to NPCs.

## 1. `CharacterClient`: add NPC methods

`frontend/assets/js/client/CharacterClient.js` currently has `fetchPc`/`updatePc`, both
hardcoding the `/pcs/` path segment. Add the NPC equivalents the same way `AuthClient` adds one
method per logical request — do not introduce a generic `kind` parameter, keep the same
explicit-method style already established:

```javascript
fetchNpc(gameSlug, characterId, token) {
  return this.request(`/games/${gameSlug}/npcs/${characterId}.json`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
}

updateNpc(gameSlug, characterId, token, fields) {
  return this.request(`/games/${gameSlug}/npcs/${characterId}.json`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(fields),
  });
}
```

(If, while implementing, the duplication between `fetchPc`/`fetchNpc` and `updatePc`/`updateNpc`
feels excessive, it's fine to factor out a private helper within the class — but keep the
public method names and signatures as above, since `PcCharacterController`/`PcCharacterEditController`
already call `fetchPc`/`updatePc` by name and must keep working unchanged.)

## 2. `NpcCharacterController.js`: authenticated fetch

`frontend/assets/js/components/pages/controllers/NpcCharacterController.js` currently fetches
via the old unauthenticated `this.client.fetch(...)`. Apply the exact fix `PcCharacterController.js`
already got in #110: accept a `characterClient` (defaulting to `new CharacterClient()`), and in
`buildEffect`, replace the `this.client.fetch(...)` call with
`this.characterClient.fetchNpc(params.game_slug, params.character_id, AuthStorage.getToken())`,
followed by the same `response.ok` check / `.json()` / catch / finally chain
`PcCharacterController.js` uses. Import `AuthStorage` from `'../../../utils/AuthStorage.js'`.

## 3. `NpcCharacter.jsx`: react to auth changes

Mirror `PcCharacter.jsx`'s `AuthEvents` subscription (added in #110) so the edit button shows
up immediately on login without a reload — subscribe in a `useEffect`, re-run
`controller.buildEffect()()` on `auth:changed`, unsubscribe on cleanup.

## 4. `CharacterHelper.jsx`: fix the hardcoded `/pcs/` edit link

`#renderEditButton` (`frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`)
currently always builds `#/games/${character.game_slug}/pcs/${character.id}/edit`. Since this
helper is shared by both `PcCharacter.jsx` and `NpcCharacter.jsx`, branch on the `is_pc` field
already present in the API response:

```javascript
const segment = character.is_pc ? 'pcs' : 'npcs';
// ...
href={`#/games/${character.game_slug}/${segment}/${character.id}/edit`}
```

This is the one change in this plan that touches code also used by the PC edit flow — verify
the existing PC edit button still works (`character.is_pc` is `true` for PCs) and update/extend
`CharacterHelperSpec.js` to cover both branches.

## 5. New route

`frontend/assets/js/utils/HashRouteResolver.js` — register, next to the existing NPC route:

```javascript
this.#router.register('/games/:game_slug/npcs/:character_id/edit', 'npcCharacterEdit');
```

`frontend/assets/js/components/helpers/AppHelper.jsx` — add to `PAGES`:

```javascript
npcCharacterEdit: <NpcCharacterEdit />,
```

(import from `../pages/NpcCharacterEdit.jsx`).

## 6. New NPC edit page, controller, and helper

Copy `PcCharacterEdit.jsx` → `NpcCharacterEdit.jsx`, `PcCharacterEditController.js` →
`NpcCharacterEditController.js`, and `PcCharacterEditHelper.jsx` → `NpcCharacterEditHelper.jsx`,
adjusting:

- Route pattern `/games/:game_slug/npcs/:character_id/edit` and the exported function name
  `getNpcCharacterEditParamsFromHash`.
- `NpcCharacterEditController` composes `NpcCharacterController` (not `PcCharacterController`)
  for `buildEffect`, and calls `this.characterClient.fetchNpc`/`updateNpc` instead of the PC
  variants (the composed `NpcCharacterController` already calls `fetchNpc` per step 2, so
  `NpcCharacterEditController` only needs to pass its own `characterClient` through, exactly
  like `PcCharacterEditController` already does for `PcCharacterController`).
- Redirect targets become `/games/${gameSlug}/npcs/${characterId}` instead of `.../pcs/...`.
- `NpcCharacterEditHelper` uses the `npc_edit_page` i18n keys (see [translator.md](translator.md))
  instead of `pc_edit_page`, and `id` attributes prefixed `npc-edit-*` instead of `pc-edit-*`.
- Keep the exported pure function (`resolveLoadedCharacter`) shared — it's already
  character-agnostic (just reads `character.can_edit`/fields), so `NpcCharacterEditController`
  can import and reuse it directly from `PcCharacterEditController.js` rather than duplicating
  it; only the redirect path differs and that's already a separate method on each controller.

## 7. Tests

Mirror every existing PC spec file for its NPC counterpart (same structure, swap PC-specific
names/paths for NPC ones):
- `CharacterClientSpec.js` — add `fetchNpc`/`updateNpc` cases.
- `NpcCharacterControllerSpec.js` — authenticated-fetch behavior (mirrors `PcCharacterControllerSpec.js`).
- `NpcCharacterSpec.js` (new) — `AuthEvents` re-fetch behavior (mirrors `PcCharacterSpec.js`).
- `CharacterHelperSpec.js` — extend to cover the `is_pc`-based edit link branching (both `pcs`
  and `npcs`).
- New `NpcCharacterEditSpec.js`, `NpcCharacterEditControllerSpec.js`,
  `NpcCharacterEditControllerHandleSubmitSpec.js`, `NpcCharacterEditHelperSpec.js` mirroring
  their PC equivalents file-for-file.

Run locally: `docker-compose run --rm majora_fe yarn lint` and
`docker-compose run --rm majora_fe yarn test`.
