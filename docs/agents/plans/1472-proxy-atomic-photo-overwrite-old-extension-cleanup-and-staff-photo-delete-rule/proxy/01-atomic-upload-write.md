# Atomic upload write
Make `UploadStorageResolver::write` atomic. After `ensureDirectoryFor($destination)`, copy the uploaded bytes to a uniquely named temp file **in the same directory** as the destination (e.g. `tempnam(dirname($destination), '.upload-')`, or a `.<basename>.<uniqid>.tmp` name), then `rename()` it over `$destination`. A rename within one directory/filesystem is atomic, so readers see either the old file or the new one, never a partial write.

- If the copy or the rename fails, remove the temp file and throw (surfacing as an error response). The original file must stay untouched.
- Keep `PathTraversalGuard::assertRealPathWithinBase` on the final destination. Make sure the temp file path is also inside the base (it shares the destination's validated directory).
- Set file permissions consistent with today's writes, since `tempnam` creates files with mode 0600. `chmod` to the default (0644) so the photos rule can still serve the file.
- Applies to both `image` and `file` upload types (shared resolver).

Tests (`UploadStorageResolverTest`, `UploadHandlerTest`):
- Overwrites an existing file at the same path with the new content.
- Leaves no temp files behind in the directory after success.
- When the write fails (e.g. unreadable `tmp_name`), the pre-existing file keeps its original content and no temp file remains.
- Written file is readable (mode check).

## Files to Change
- `proxy/extension/lib/support/UploadStorageResolver.php` — temp-file + rename write, cleanup on failure, permissions.
- `proxy/extension/tests/support/UploadStorageResolverTest.php` — overwrite/atomicity/cleanup tests.
