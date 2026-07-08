# Frontend Plan: Add create/edit links API

Main plan: [plan.md](plan.md)

## Shared contracts

See "Links payload shape" in [plan.md](plan.md#shared-contracts) — this agent builds the
"Edit links" modal and wires its local `links` state into the existing character edit submit
flow, so a `links` array (shape below) is included in the `PATCH`/`POST` payload the backend now
accepts.

```json
{ "id": 12, "text": "Loot table", "url": "https://example.com/loot", "link_type": "lootstudio", "delete": false }
```

- `id` omitted for a new, non-persisted link.
- `text` optional — when blank at submit time, default it to the link's `url` before sending
  (per the issue's validation rule; this is a frontend responsibility, not backend).
- `url` required to save a link; enforce this client-side too (disable/validate before confirm,
  or rely on the backend's 400 + `fieldErrors`, whichever is simpler given time — prefer basic
  client-side validation in the modal for a good UX, in addition to surfacing backend errors).
- `link_type` optional.

No response shape changes to plan around: `character.links` (from `CharacterDetailSerializer`)
keeps its current `{ id, text, url, link_type }` shape and continues to seed the modal.

## Implementation Steps

### Step 1 — `LinksEditModal` component + controller + helper

Follow the existing modal pattern (see `frontend/assets/js/components/elements/TaskDetailModal.jsx`
+ `helpers/TaskDetailModalHelper.jsx` for a directly comparable local-state edit modal, and
`react-bootstrap/cjs/Modal.js` for the shell):

- `frontend/assets/js/components/elements/LinksEditModal.jsx` — functional component. Props:
  `show`, `links` (character's current links array), `onClose` (cancel — discard local state),
  `onConfirm(links)` (called with the modal's local links array on confirm). Holds local state
  seeded from `props.links` whenever `show` transitions to true (mirror the `useEffect` pattern
  in `TaskDetailModal.jsx`), independent from the character page state until confirmed.
- `frontend/assets/js/components/elements/helpers/LinksEditModalHelper.jsx` — static `render`
  method rendering the modal shell (`Modal`/`Modal.Header`/`Modal.Body`/`Modal.Footer`), the list
  of link blocks, an "Add Link" button, and Confirm/Cancel actions in the footer.

Each link block (rendered per local link entry):
- text field, URL field, and a `link_type` dropdown — reuse `FormField`
  (`frontend/assets/js/components/elements/FormField.jsx`) for text/URL, and reuse
  `LinkIcon`/the `LINK_TYPE_ICONS`-style mapping already in
  `frontend/assets/js/components/elements/LinkIcon.jsx` to show each option's icon + label in
  the dropdown (currently only `lootstudio`; add a blank/"none" option too).
- a trash icon (bootstrap `bi-trash-fill`) top-right, per the issue's delete semantics:
  - **persisted link (`id` present)**: clicking `trash-fill` collapses the block to a
    text-only, and swaps to `bi-plus-circle-fill`; sets `delete: true` on that entry in local
    state (do not remove it from the local array — it must still be sent so the backend can
    delete it). Clicking `plus-circle-fill` restores the block and clears `delete: true`.
  - **non-persisted link (no `id`)**: clicking `trash-fill` removes the entry from the local
    array entirely (nothing to tell the backend about).
- "Add Link" button appends a new local entry `{ text: '', url: '', link_type: '' }` (no `id`,
  no `delete`).

### Step 2 — Wire the modal into the character edit page

In `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`:
- add `links` state (`useState`), seeded from `controller.applyLoadedCharacter` alongside the
  other fields (extend `BaseCharacterEditController.applyLoadedCharacter`/`#fieldsFromCharacter`
  to seed `links` from the loaded `character.links`).
- add `showLinksModal` state, an "Edit links" button below `LinkList` in
  `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` (below the existing
  `<LinkList links={state.links} />` at line 67) that opens the modal.
- filter links marked `delete: true` out of what `LinkList` renders on the edit page itself
  (they should still show inside the modal) — either filter before passing to `LinkList`, or
  let `LinkList` ignore them; simplest is filtering in `CharacterEdit.jsx`/the helper before
  the `<LinkList links={...} />` call.
- render `<LinksEditModal show={showLinksModal} links={links} onClose={...} onConfirm={(newLinks) => { setLinks(newLinks); setShowLinksModal(false); }} />` alongside the existing
  `<PhotoUploadModal ... />` render.
- on confirm, only local state changes — no API request (per the issue). On cancel, discard
  local modal changes and close.

### Step 3 — Include `links` in the submit payload

In `BaseCharacterEditController` (`frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`):
- `submitForm`/`handleSubmit` need to accept/forward `links` alongside the existing fields
  (`name`, `role`, `public_description`, ...). Update `CharacterEdit.jsx`'s `handleSubmit` call
  to pass `links` through `formValues`, and `submitForm` to include a `links` key in the
  `fields` object sent via `this.characterClient.updateCharacter(...)`. Before sending, map
  each local link entry to the wire shape from "Shared contracts" above (default blank `text`
  to `url`; drop any purely-client bookkeeping fields that shouldn't be sent, if any are added).

### Step 4 — Specs

Mirror `frontend/specs/assets/js/` structure:
- `frontend/specs/assets/js/components/elements/LinksEditModalSpec.js` — new link add/remove
  (persisted vs non-persisted), confirm/cancel behavior, text/url/link_type editing.
- `frontend/specs/assets/js/components/elements/helpers/LinksEditModalHelperSpec.js` if the
  project's convention tests helpers separately (check existing `TaskDetailModalHelperSpec.js`
  first for the expected split between component-spec and helper-spec coverage).
- Update `frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js` (check exact
  filename) and `BaseCharacterEditControllerSpec.js` (check exact filename) to cover: opening
  the modal, `links` being seeded from the loaded character, and `links` being included in the
  submit payload.

## Files to Change

- `frontend/assets/js/components/elements/LinksEditModal.jsx` — new.
- `frontend/assets/js/components/elements/helpers/LinksEditModalHelper.jsx` — new.
- `frontend/assets/js/components/elements/LinkIcon.jsx` — possibly extend with an exported
  option list (label + icon) reusable by the modal's `link_type` dropdown, if not already easy
  to reuse as-is.
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — add `links`/`showLinksModal`
  state, render the modal.
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — add "Edit links"
  button, filter out `delete: true` links from the visible `LinkList`.
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js` — seed and
  forward `links` through `applyLoadedCharacter`/`submitForm`/`handleSubmit`.
- New/updated specs under `frontend/specs/assets/js/components/elements/` and
  `frontend/specs/assets/js/components/pages/`.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks` —
  relevant once the translator agent adds the new `links_edit_modal` keys; run this after their
  keys land to confirm parity)

## Notes

- Confirm the exact spec filenames for `CharacterEdit` / `BaseCharacterEditController` before
  editing (grep `frontend/specs/` — this plan infers likely names by convention but did not
  verify them character-for-character).
- Coordinate with the backend agent on whether per-link validation errors are surfaced
  (`fieldErrors.links`) or only a generic failure; if the backend only returns a top-level 400,
  keep client-side `url`-required validation as the primary UX safeguard.
