# Proxy Plan: Refactor: add missing blank line before first member var in 13 proxy/ PHP classes

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Add blank line before first member variable in 13 classes
Codacy's PHP_CodeSniffer scan (`Squiz.WhiteSpace.MemberVarSpacing`, CodeStyle, Info severity) flags each class below because its first member variable declaration (or the docblock immediately preceding it) directly follows the opening `{` or a prior statement with no blank line in between. Insert a single blank line immediately before the first member variable's declaration (or before its `/** @var ... */` docblock, when one is present) in each file. Do not touch any other spacing in these files.

## Files to Change
- `proxy/extension/lib/support/DirectorySizeCalculator.php:19` — blank line before `/** @var string ... */` / `private string $tool;`
- `proxy/extension/lib/support/BackendClient.php:35` — blank line before `/** @var string ... */` / `private string $host;`
- `proxy/extension/lib/exceptions/UnprocessableUploadException.php:17` — blank line before `/** @var array|null ... */` / `private ?array $uploadedFile;`
- `proxy/extension/lib/handlers/CacheSizeHandler.php:30` — blank line before `/** @var BackendClient ... */` / `private BackendClient $client;`
- `proxy/extension/lib/cache/PrivateRequestHasher.php:36` — blank line before `private string $headerName;` (no docblock present)
- `proxy/extension/lib/support/UploadStorageResolver.php:16` — blank line before `/** @var string ... */` / `private string $uploadType;`
- `proxy/extension/lib/support/DuDirectorySizeStrategy.php:19` — blank line before `/** @var ShellExecutorInterface ... */` / `private ShellExecutorInterface $shell;`
- `proxy/extension/lib/handlers/DeleteHandler.php:25` — blank line before `/** @var BackendClient ... */` / `private BackendClient $client;`
- `proxy/extension/lib/exceptions/BackendErrorException.php:17` — blank line before `/** @var int ... */` / `private int $httpCode;`
- `proxy/extension/lib/handlers/CacheClearHandler.php:33` — blank line before `/** @var BackendClient ... */` / `private BackendClient $client;`
- `proxy/extension/lib/exceptions/ShellCommandFailedException.php:19` — blank line before `/** @var string ... */` / `private string $command;`
- `proxy/extension/lib/support/UploadFilenameValidator.php:22` — blank line before the multi-line `@var string[]` docblock / `private array $allowedExtensions;`
- `proxy/extension/lib/support/SecurePhotoStorage.php:28` — blank line before `/** @var string ... */` / `private string $basePath;`

## CI Checks
- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`, "Check PHP Lint" step)

## Notes
- No behavior changes — purely whitespace formatting to satisfy `Squiz.WhiteSpace.MemberVarSpacing`.
- After the fix, re-run the CI check above to confirm 0 findings for this rule across all 13 files.
