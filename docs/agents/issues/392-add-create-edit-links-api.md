# Add create/edit links API

## Context

Character (PC and NPC) pages currently display links, but there is no way to create, edit, or delete them from the UI. The backend has no support for creating, updating, or deleting `CharacterLink` records — the existing `CharacterLinkSerializer` is read-only, nested under the character detail serializer. This issue adds an "Edit links" modal to the character edit page, and extends the backend character create/update flow to persist link changes.

## What needs to be done

### Frontend — Character edit page
- Below the existing links list, add an "Edit links" button that opens the links modal.
- Links marked `delete: true` are hidden from the character's links list (they remain visible only inside the modal).

### Frontend — Edit Links modal
- The modal receives a local copy of the character's links, independent from the character page state until confirmed.
- Each link is shown as a block with:
  - a text field
  - a URL field
  - a `link_type` dropdown, showing (where available) the link type's label and icon
- Each block has a trash icon (bootstrap `trash-fill`) in the top-right corner to remove the link.
- An "Add Link" button appends a new, empty link block (no `id`) to the list, behaving like any other non-persisted link.

#### Deleting a link
- **Persisted link (has an `id`)**: clicking the trash icon collapses the block to show only the text, and replaces the trash icon with a `plus-circle-fill` icon; the link is marked `delete: true` in local modal state. Clicking `plus-circle-fill` restores the block and clears the `delete: true` flag.
- **Non-persisted link (no `id`)**: clicking the trash icon removes it from the local list entirely.

#### Validation
- `url` is required for a link to be saved.
- `text` is optional; when left blank, the URL itself is used as the display text.
- `link_type` is optional.

#### Confirm / Cancel
- **Confirm**: the modal's local link data replaces the character's links data on the edit page. No API request is made yet.
- **Cancel**: the modal closes and discards local changes; the character's links data is left untouched.

#### Commit
- When the character is saved/created (`POST /games/:game_slug/characters` or `PATCH /games/:game_slug/characters/:id`), the current links data is included in the request payload.

### Backend
- The character create/update endpoints accept the links payload and process it:
  - links with `delete: true` are deleted
  - links without an `id` are created
  - links with an `id` and no `delete: true` are updated

## Acceptance criteria

- [ ] The character edit page has an "Edit links" button that opens a links modal.
- [ ] The links modal lists each link with editable text, URL, and `link_type` fields, plus a delete/restore control.
- [ ] Clicking "Add Link" appends a new, empty, non-persisted link block.
- [ ] Deleting a persisted link marks it `delete: true` and collapses its block; deleting a non-persisted link removes it from the local list.
- [ ] `url` is required and `link_type` is optional when saving a link; blank `text` falls back to the URL as display text.
- [ ] Confirming the modal updates the character edit page's local links state without making an API request; cancelling discards local changes.
- [ ] Saving/creating the character (`POST`/`PATCH` character endpoints) includes the links payload in the request.
- [ ] The backend character create/update endpoints process the links payload: create links without an `id`, update links with an `id` and no `delete: true`, and delete links with `delete: true`.

Tags: :shipit:
