# Cross-domain mode for ResponseCacheClearer and its middleware
Add a cross-domain mode so one `X-Cache-Clear` header clears its paths in every domain cache folder. The existing single-folder mode stays the default and behaves exactly as today.

- `ResponseCacheClearer`:
  - Add a named constructor `ResponseCacheClearer::forRoot(string $cacheRoot): self`, where `''` means a no-op.
  - In cross-domain mode, `clearFrom()` keeps the 2xx check, header parsing and `isValidPath()` validation unchanged. Then, for each valid path, it clears it in every target folder:
    - the root itself, which covers dev's flat layout;
    - every directory directly under the root whose name matches `^domain_[0-9a-f]{64}$`, enumerated at clear time (new domains appear at runtime).
  - Before using a domain folder, run `PathTraversalGuard::assertRealPathWithinBase($root, $folder)`. If that fails, or the per-path check inside the folder fails, log a warning, skip that folder, and keep clearing the others.
  - Implementation hint: build one single-folder clearer (`FolderLocation` + `CacheDirCleaner` + `CacheDirResolver`) per target folder and reuse the existing private `clearPath()` logic, rather than duplicating it.
  - Update the class docblock to describe the cross-domain mode and its use: copy request and copy-link finalize.
- `ResponseCacheClearMiddleware`: add a `cross_domain` attribute (boolean, default `false`) to `build()`. When it's true, `location` is the cache root and the middleware uses `ResponseCacheClearer::forRoot()`. Stripping the request and response headers is unchanged.

## Files to Change
- `proxy/extension/lib/support/ResponseCacheClearer.php` — cross-domain mode (`forRoot`, folder enumeration, per-folder guard).
- `proxy/extension/lib/middlewares/ResponseCacheClearMiddleware.php` — `cross_domain` attribute.
- `proxy/extension/tests/support/ResponseCacheClearerTest.php` — cross-domain tests:
  - clears a path in several `domain_*` folders and in the flat root;
  - ignores non-`domain_*` entries and files;
  - a symlinked `domain_*` folder pointing outside the root is skipped while the others are still cleared;
  - invalid paths are skipped;
  - non-2xx responses are a no-op;
  - `forRoot('')` is a no-op.
- `proxy/extension/tests/middlewares/ResponseCacheClearMiddlewareTest.php` — `cross_domain` attribute: clears across folders and still strips the header.
