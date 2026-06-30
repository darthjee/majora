# Issue: Enable buttons on error

## Description
In several frontend forms, clicking Submit/Save disables the button while the request is in flight, gated by a state value (e.g. `status: 'idle' | 'submitting' | 'error' | 'success'`, or a dedicated boolean like `uploading`).

## Problem
When the request fails, the button is expected to be re-enabled so the user can retry. An investigation of the codebase found this is implemented per-form (no shared hook/HOC) via each page's controller class. Most forms already do this correctly through a `try/catch` that resets the disabling state on failure: Game new/edit, Treasure new/edit, Register, RecoverPassword, and Login.

Two areas are broken:

- **NPC and PC character edit forms** (sharing `BaseCharacterEditController`, frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js): `submitForm` sets `status` to `'submitting'`, but the `setters` object is never forwarded into `handleSubmit` or `#handleResponse`, so `setStatus` is never called again after a failure (network error, validation 400, or server 500). The Save button stays disabled until the page is reloaded.
- **Photo upload modal** (frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js): `handleSubmit` calls `setUploading(true)` before the request, but none of its failure branches (`!initResponse.ok`, `!submitResponse.ok`, or the `catch` block) call `setUploading(false)` — only `handleClear()` resets it, which runs solely when the user closes the modal. The Upload button stays disabled until the modal is closed and reopened.

## Expected Behavior
After any failed submit/save/upload request (network error, validation error, or server error), the form's button is re-enabled so the user can correct the issue and retry, without needing to reload the page or close/reopen a modal.

## Solution
- Fix `BaseCharacterEditController` so its `setters` are forwarded into `handleSubmit`/`#handleResponse`, restoring `status` on both error paths (catch block and non-success response handling), consistent with how the other controllers already behave.
- Fix `PhotoUploadModalController.handleSubmit` to call `setUploading(false)` on every failure branch (init failure, submit failure, and the catch block).

---

Tags: :shipit:
