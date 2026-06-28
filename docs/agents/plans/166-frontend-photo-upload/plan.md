# Plan: Frontend Photo Upload

Issue: [166-frontend-photo-upload.md](../issues/166-frontend-photo-upload.md)

## Overview

Add a photo upload UI to the game edit page. A new `PhotoUploadModal` element (component + controller + helper) provides a drag-and-drop / file-picker dialog. A new `UploadClient` orchestrates the two-step upload: init via `POST /games/:slug/photo_upload.json`, then submit via `PATCH /uploads/:id/submit` with the file and token. New translation keys are added to both `en.yaml` and `pt.yaml`.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

Translation namespace `photo_upload_modal` (used by `PhotoUploadModalHelper` via `Translator.t(...)`):

| Key | Type | Description |
|-----|------|-------------|
| `photo_upload_modal.title` | string | Modal header title |
| `photo_upload_modal.submit` | string | Submit button label |
| `photo_upload_modal.cancel` | string | Cancel button label |
| `photo_upload_modal.error` | string | Generic upload error message shown in the modal body |

The `game_edit_page` namespace gains one new key:

| Key | Type | Description |
|-----|------|-------------|
| `game_edit_page.upload_photo_button` | string | Label for the "Upload Photo" button on the edit page |
