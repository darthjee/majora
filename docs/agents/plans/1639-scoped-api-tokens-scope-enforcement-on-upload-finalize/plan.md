# Plan: Scoped API tokens: scope enforcement on upload finalize

Issue: [1639-scoped-api-tokens-scope-enforcement-on-upload-finalize.md](../../issues/1639-scoped-api-tokens-scope-enforcement-on-upload-finalize.md)

## Overview
Let scoped API tokens finalize uploads. `upload_finalize` declares `@token_scopes(PATCH=[])` so tokens get past `ApiTokenAuthentication`. A new in-view check then picks the required scopes and the game from the upload's `content_object`, using a fixed model → scopes map. It rejects staff- and copy-origin uploads. All the work is in the backend.

See [backend.md](backend.md) for the full plan.
