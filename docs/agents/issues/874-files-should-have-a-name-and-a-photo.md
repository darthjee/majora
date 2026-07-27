# Issue: Files should have a name and a Photo

## Description
`GameDocumentFile` (`backend/games/models/game/game_document_file.py`), based on `BaseFile` (`backend/games/models/base_file.py`), is our first "file" entity — analogous to how `Photo` entities are based on `BasePhoto`, sharing the common `ready` attribute. Unlike photos, files currently have no name and no photo to represent them.

## Problem
- Files have no `name`, so there is nothing user-facing to identify them by — only an internal `path`.
- Files have no photo, so a future file list has nothing to show as a thumbnail/preview.

## Expected Behavior
- Every `GameDocumentFile` has a `name` and a `photo` relation.
- Existing files get `name` backfilled from their current `path` (the `<original_file_name>` portion, stripping the `_<uuid>` suffix and extension).
- Uploading a new file lets the user provide a name; if left blank, the name falls back to the uploaded file's own filename.
- Each `GameDocumentFile` has exactly one associated photo. Actually uploading that photo is separate, later work (out of scope here) — this issue only adds the relation.
- No files-list endpoint/serializer is added by this issue; that remains separate future work.

## Solution
- Add `name` (`CharField`) directly to `BaseFile`, since it's common to every File entity (`GameDocumentFile` today, future File entities later).
  - Data migration: backfill `name` for existing rows by extracting `<original_file_name>` from `path` (format `<folder/path>/<original_file_name>_<uuid>.<extension>`), stripping the trailing `_<uuid4>` suffix and extension.
- Add a new `GameDocumentFilePhoto` model (extends `BasePhoto`, mirroring the existing `GameDocumentPhoto`), with `GameDocumentFile` holding a `photo` FK to it — one photo per file.
  - `BaseFile` is abstract, and each File subclass needs its own concrete Photo model, so the `photo` FK itself is declared per-subclass (e.g. on `GameDocumentFile`, targeting `GameDocumentFilePhoto`) rather than as a shared field on `BaseFile`. `name` is the one attribute that lives directly on `BaseFile`.
  - Photo upload itself is out of scope for now — see "Out of scope" below.
- Add a `name` input to the file upload form.
- Endpoint change `POST /game/:game_slug/documents/:id/file_upload`: accept a new, optional `name` field, alongside the existing `filename` field (still used as-is for the storage path). When `name` is blank, fall back to `filename`.
- No changes to permissions.
- No changes to the proxy.

### Out of scope
- Document File Photo upload (the `photo` relation is added, but there is no upload flow for it yet).
- A files-list endpoint/serializer showing name + photo (no such listing exists today; this issue only lays the groundwork for it).

## Benefits
- Files become identifiable by a meaningful name instead of only an internal path.
- Lays the groundwork (name + photo relation) needed for a future file list UI.
