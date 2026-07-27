# Plan: Files should have a name and a Photo

Issue: [874-files-should-have-a-name-and-a-photo.md](../issues/874-files-should-have-a-name-and-a-photo.md)

## Overview

Add a `name` field to `BaseFile` (backfilled for existing `GameDocumentFile`
rows from their `path`), and give `GameDocumentFile` a single-photo relation
via a new `GameDocumentFilePhoto` model — mirroring the existing
`cover_photo`/`profile_photo` "owner FK's its single photo" pattern already
used by `Game`/`Character`, rather than the "photo FK's its many owners"
pattern used by `GameDocumentPhoto`. The file-upload form gains an optional
name input, and the upload-init endpoint accepts an optional `name`,
falling back to the uploaded file's own filename when blank. Photo upload
itself, and any files-list UI/endpoint, stay out of scope.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Endpoint change: `POST /games/:game_slug/documents/:id/file_upload.json`

Request body gains an optional `name` field, alongside the existing
`filename` field (unchanged — still used as-is to derive the storage path):

```json
{ "filename": "scroll.pdf", "name": "Ancient Scroll" }
```

- `name` is optional/blankable. When omitted or blank, the backend falls
  back to using `filename` as the `GameDocumentFile.name`.
- `filename`'s existing validation (extension allowlist, sanitization) is
  unchanged; `name` is a plain optional string (no extension/format checks).
- Response shape (`upload_id`, `token`, `upload_type`, `document_id`) is
  unchanged.

### Frontend name input (frontend produces the UI, backend consumes the value)

`PhotoUploadModal` (shared between the photo-upload and file-upload variants
via `translationPrefix`/`accept` props) gains a new opt-in prop, e.g.
`showNameField` (name to be finalized by the frontend agent), true only for
the file-upload usage in `GameDocument.jsx`. When true, the modal renders a
text input for the name and includes it in the `initUpload` POST body as
`name`. The photo-upload variant is unaffected (prop defaults to `false`,
no `name` sent, existing behavior/tests untouched).

### Translation key (translator produces, frontend consumes via `Translator.t()`)

A new key under the existing `file_upload_modal` namespace (e.g.
`file_upload_modal.name_label` — exact key name up to the translator agent)
for the name input's label/placeholder, in both `en.yaml` and `pt.yaml`. Not
added to `photo_upload_modal`, since that variant doesn't show the input.

## Notes

- `data-access`/`security` review isn't required here — no new endpoint,
  no permission/auth change, only a new optional field on an existing
  authenticated endpoint.
- `product-owner` isn't required either — `GameDocumentFilePhoto` isn't a
  new user-facing entity/concept, it's an implementation detail mirroring
  the existing `BasePhoto` pattern for a relation the issue already
  describes precisely (one photo per file).
