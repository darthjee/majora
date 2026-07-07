# Fix PHP Codacy problems

## Context

Codacy has reported several PHP style and security problems in the proxy extension code (`proxy/extension`) that need to be fixed. Two categories originally reported are already resolved and out of scope for this issue:

- **Missing doc comment for function** — every method in `proxy/extension/lib/` already has a PHPDoc comment; this only applies to production code, not test files.
- **The use of `mkdir()` is discouraged** — already fixed by extracting the call into `SecurePhotoStorage::ensureDirectoryFor()` (issue #303 / PR #308), which validates the target path against traversal before creating the directory. It's the only raw `mkdir()` call left in `proxy/extension`.

Codacy still flags two remaining categories of style issues, both confined to `proxy/extension/lib/PhotoUploadHandler.php` and its test file:

1. **Closing parenthesis of a multi-line function call must be on a line by itself.** 4 instances (2 in `PhotoUploadHandler.php`, 2 in `PhotoUploadHandlerTest.php`), e.g.:
   ```php
   'postFields'    => [],
   ]);
   ```
2. **Operation must be bracketed.** 9 unbracketed null-coalescing (`??`) expressions in `PhotoUploadHandler.php`, e.g.:
   ```php
   $this->httpClient = $httpClient ?? new CurlHttpClient();
   ```

## What needs to be done

Proxy:
- Move the closing `)` of the 4 flagged multi-line function calls onto its own line, separate from the closing `]` of the inline array argument — in both `proxy/extension/lib/PhotoUploadHandler.php` and `proxy/extension/tests/.../PhotoUploadHandlerTest.php` (2 instances each).
- Wrap all 9 flagged `??` expressions in `proxy/extension/lib/PhotoUploadHandler.php` in parentheses.
- Do not change existing behavior — this is a pure formatting fix.

## Acceptance criteria

- [ ] The 4 flagged multi-line function calls have their closing `)` on its own line, in both `PhotoUploadHandler.php` and `PhotoUploadHandlerTest.php`.
- [ ] All 9 flagged `??` expressions in `PhotoUploadHandler.php` are wrapped in parentheses.
- [ ] Proxy PHP code passes the Codacy quality gate for these two rules.
- [ ] Existing proxy tests still pass with no behavior change.

Tags: :shipit:
