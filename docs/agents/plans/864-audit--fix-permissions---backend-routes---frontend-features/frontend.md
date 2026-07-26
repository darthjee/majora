# Frontend Plan: [AUDIT] Fix Permissions

See [backend.md](backend.md) for the permission-class changes this depends on, and
[plan.md](plan.md)'s "Shared contracts" for why fixes 2/4 need no code change here while fix 5
does.

## Fix 2 & 4 — Item/document create+edit buttons: verification only, no code change expected

- `GameItemsController.js` (`can_create_item`), `GameDocumentsController.js`/
  `GameDocumentNewController.js` (`can_create_document`), and `CharacterItemsAccessController.js`/
  `CharacterItemNewController.js` (character-level `can_create_item`) all read the flag straight
  off `AccessStore.ensureGamePermissions`/the character permissions endpoint — the exact fields
  `GamePermissionsSerializer`/`CharacterPermissionsSerializer` compute from the backend permission
  classes. Once backend.md's fixes 2 and 4 land, these buttons open to players automatically.
- Action: after the backend fix ships, manually verify (or add a spec if one doesn't already
  exist) that a plain player of the game now sees "New Item"/"New Document" on `GameItems`/
  `GameDocuments`, and the item edit/new pages for a PC/NPC they don't own no longer redirect them
  away (`CharacterItemNewController.js:129`'s `if (!permissions.can_create_item)` redirect).
- No component/controller code changes anticipated for this part.

## Fix 3 — PC/NPC item photo upload: verification only

`CharacterItemEdit.jsx`'s upload-modal trigger isn't itself gated by a separate frontend
permission check beyond reaching the edit page at all (which fix 2's `can_create_item` already
covers) — the actual photo-upload request is authorized server-side by
`CharacterItemPhotoUploadPermission`. Once backend.md's fix 3 ships, verify: a non-owner player
can upload a photo for a PC's item they don't own, and a Staff account can no longer upload a
photo for an NPC's item (403 today would become a visible failure if a Staff-only path still
assumes success anywhere — check `PhotoUploadModal`'s error handling surfaces a 403 sanely, it
should already since it's a generic modal).

## Fix 5 — Game session create/update: switch off the generic `can_edit` flag

Today's "New Session" button and per-session Edit button both key off the game's generic
`can_edit` (dm/admin/superuser) via `AccessStore`, which won't change when backend.md's fix 5
broadens `GameSessionEditPermission` — a new `can_edit_session` field is needed (see plan.md).
Once backend.md exposes it on `GamePermissionsSerializer`, update:

- `GameSessionsController.js:106` — `.then((permissions) => safeSet(this.setCanEdit, Boolean(permissions.can_edit)))`
  → read `permissions.can_edit_session` instead of `permissions.can_edit`.
- `GameSessionNewController.js:93` — `#redirectIfNotAllowed`'s `if (!permissions.can_edit)` →
  `if (!permissions.can_edit_session)`.
- `GameSessionController.js` — no change needed to `#mergePermissions` itself (it already spreads
  the whole permissions object onto `session`), but `session.can_edit` used downstream needs to
  become `session.can_edit_session`:
  - `GameSessionEdit.jsx:34` — `if (!session.can_edit) {` → `if (!session.can_edit_session) {`
  - `GameSessionHelper.jsx:36` — `{session.can_edit && (<EditButton ...>` → `{session.can_edit_session && (...`
  - `GameSessionHelper.jsx:56` — `if (!session.can_edit || session.date) {` → same field swap
    (this guards the DM-only "Create Poll" button shown only for undated sessions — keep the
    `session.date` half of the condition unchanged, only swap the permission half)
- Update the JSDoc `@param` comments referencing `can_edit`/`canEdit` in
  `GameSessionsHelper.jsx`/`GameSessionHelper.jsx` to describe the new field/meaning.

## Fix 1 — Players list: verify Staff visibility

`GamePlayersHelper.jsx` is read-only (no edit affordances to gate), so no button-visibility
change is expected. Verify the "Players" nav link/route itself isn't separately route-guarded
away from Staff accounts (distinct from the button-level gating audited elsewhere) — if it is,
that guard needs the same Staff/Superuser bypass backend.md's fix 1 adds server-side.

## Tests

Extend existing Jasmine specs for each touched controller
(`frontend/specs/assets/js/components/resources/game_session/...`, mirroring the
`GameSessionsControllerSpec`/`GameSessionNewControllerSpec`/`GameSessionEditSpec` naming already
used for this resource) to cover the new `can_edit_session` field. No new spec files expected for
fixes 2/3/4 beyond whatever verification step above turns up.

## CI Checks

`docker-compose run --rm majora_fe yarn lint` and `docker-compose run --rm majora_fe yarn test`
(per `AGENTS.md`'s frontend stack).
