# Proxy Plan: Fix missing/incorrect member variable doc comments in 4 proxy/ PHP classes

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Fix the 4 flagged member-variable doc comments

Current line numbers reflect the files' state as of #1363 ("add missing blank line before first member var in 13 proxy/ PHP classes"), which shifted 3 of the 4 flagged locations down by one line from Codacy's original scan.

- `proxy/extension/lib/cache/PrivateRequestHasher.php:37` — `private string $headerName;` has no doc comment; add one following this file's existing PHPDoc style, e.g. `/** @var string Header name to read the cache token from. */`.
- `proxy/extension/lib/exceptions/BackendErrorException.php:17` — change `/** @var int HTTP status code to forward to the client. */` to use `@var integer`.
- `proxy/extension/lib/exceptions/ShellCommandFailedException.php:22` — change `/** @var int The exit code returned by the command. */` to use `@var integer`.
- `proxy/extension/lib/support/UploadContentValidator.php:61` — change `/** @var bool Whether the '%PDF-' magic-bytes check runs on top of the fileinfo content check. */` to use `@var boolean`.

Each fix is purely a doc-comment correction — no behavioral change, no other lines in these files need to move.

## Files to Change

- `proxy/extension/lib/cache/PrivateRequestHasher.php` — add missing `@var string` doc comment for `$headerName`
- `proxy/extension/lib/exceptions/BackendErrorException.php` — `@var int` → `@var integer`
- `proxy/extension/lib/exceptions/ShellCommandFailedException.php` — `@var int` → `@var integer`
- `proxy/extension/lib/support/UploadContentValidator.php` — `@var bool` → `@var boolean`

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`, step "Check PHP Lint")

## Notes

- Purely a documentation/lint fix — `Squiz.Commenting.VariableComment` is an Info-severity finding, no runtime behavior changes.
- Re-verify each target line number against the file's current state before editing, in case another PR shifts these files again before this one lands.
