# Update docblocks and the spec note
- In the `ResponseCacheClearer` class docblock ("Cross-domain mode" section), add staff photo delete (`DeleteHandler`) and upload finalize (`UploadHandler`) to the list of places that use it.
- Update the `DeleteHandler` and `UploadHandler` class docblocks: listed paths are now cleared in every domain cache folder and in the root.
- In `docs/agents/specs/game-content-copy/permissions.md#cache`, replace the side note that staff photo delete/finalize "already has the same single-domain gap today" with a statement that it now clears across every domain too (issue #1580).

## Files to Change
- `proxy/extension/lib/support/ResponseCacheClearer.php` — docblock only.
- `proxy/extension/lib/handlers/DeleteHandler.php` — class docblock.
- `proxy/extension/lib/handlers/UploadHandler.php` — class docblock.
- `docs/agents/specs/game-content-copy/permissions.md` — update the side note in `## Cache`.
