# Proxy Plan: Split UploadHandler.php into single-responsibility classes (PHPMD TooManyMethods)

Main plan: [plan.md](plan.md)

## Overview

`UploadHandler` (554 lines, 16 non-getter/setter methods) mixes request parsing, content validation, backend status polling, and file persistence in one class, and its constructor duplicates wiring per upload type (`image`/`file`). Extract three collaborators under `proxy/extension/lib/support/`, each built via a static `forType(string $uploadType): self` factory rather than the handler holding a separate pair of instances per type. `UploadHandler` keeps only `extractUploadIdentifiers`, `processsRequest`, and `unprocessableEntityResponse`.

## Implementation Steps

### Step 1 — `UploadContentValidator` (mime/rejection-reason logic)

New file `proxy/extension/lib/support/UploadContentValidator.php`, namespace `Tent\RequestHandlers`.

- Move `IMAGE_MIME_TYPES`, `IMAGE_EXTENSIONS`, `FILE_MIME_TYPES`, `FILE_EXTENSIONS` here as private consts.
- Private constructor taking `array $allowedMimeTypes`, `UploadFilenameValidator $filenameValidator`, `bool $checkPdfMagicBytes`.
- `public static function forType(string $uploadType): self` — for `'file'`: `FILE_MIME_TYPES`, `new UploadFilenameValidator(FILE_EXTENSIONS)`, `checkPdfMagicBytes = true`; otherwise (`'image'`): `IMAGE_MIME_TYPES`, `new UploadFilenameValidator(IMAGE_EXTENSIONS)`, `checkPdfMagicBytes = false`. This composes with the existing `UploadFilenameValidator` rather than replacing it.
- `public function rejectionReasonFor(?array $file): ?string` — merges `imageRejectionReason`/`fileRejectionReason` into one method driven by the instance's config: `missing_file` when `$file === null`; then mime-type allow-list check; then `$filenameValidator->isAllowed()`; then `detectedMimeType()` allow-list check; then, only `if ($this->checkPdfMagicBytes)`, the `hasPdfMagicBytes()` check. Preserve the exact original check order (mime → extension → detected-mime → magic-bytes) and exact return values so behavior is identical for both types.
- Move `detectedMimeType(string $tmpName): ?string` and `hasPdfMagicBytes(string $tmpName): bool` here unchanged, as private methods.

### Step 2 — `UploadStatusClient` (backend status polling)

New file `proxy/extension/lib/support/UploadStatusClient.php`, namespace `Tent\RequestHandlers`.

- Move `EXTRA_ALLOWED_FORWARD_HEADERS` here as a private const.
- Constructor: `__construct(BackendClient $client, string $uploadType)`. `BackendClient` stays generic/shared — construct it once in `UploadHandler`'s constructor as today and pass it in per-request; do not duplicate `BackendClient` construction.
- `public function requestUploadingStatus(string $uploadId, array $headers): string` and `public function requestUploadedStatus(string $uploadId, array $headers): void` — moved unchanged (drop the `$uploadType` parameter from their signatures since it's now instance state).
- `private function updateStatus(string $uploadId, string $status, array $headers): array` — moved unchanged, using `$this->uploadType` in the backend path.

### Step 3 — `UploadStorageResolver` (file persistence)

New file `proxy/extension/lib/support/UploadStorageResolver.php`, namespace `Tent\RequestHandlers`.

- Private constructor taking `string $uploadType`, `string $basePath`, `SecurePhotoStorage $storage` (store `$uploadType` too, so the log line below can keep its exact original message).
- `public static function forType(string $uploadType, string $photosBasePath, string $filesBasePath): self` — resolves `$basePath` via the same `$uploadType === 'file' ? $filesBasePath : $photosBasePath` rule as today's `basePathFor()`, and builds a fresh `SecurePhotoStorage($basePath)`.
- `public function write(string $filePath, array $file): string` — moved body of `writeUploadedFile()` unchanged (the `Logger::error('[upload] - saving ' . $uploadType . ' file to: ' . $destination)` call, `ensureDirectoryFor()`, `file_put_contents()`, `PathTraversalGuard::assertRealPathWithinBase()`, return `$destination`).

### Step 4 — Trim `UploadHandler`

Edit `proxy/extension/lib/handlers/UploadHandler.php`:

- Remove `IMAGE_MIME_TYPES`, `IMAGE_EXTENSIONS`, `FILE_MIME_TYPES`, `FILE_EXTENSIONS`, `EXTRA_ALLOWED_FORWARD_HEADERS` consts (moved out in Steps 1–2). Keep `ALLOWED_UPLOAD_TYPES` — it's used by `extractUploadIdentifiers()` for route validation, a distinct concern from content-type validation.
- Remove the `$photoStorage`/`$fileStorage` and `$imageFilenameValidator`/`$fileFilenameValidator` properties and their constructor wiring. Keep `$client` (the shared `BackendClient`), `$photosBasePath`, `$filesBasePath`.
- Remove `validateUploadedFile`, `rejectionReasonFor`, `imageRejectionReason`, `fileRejectionReason`, `detectedMimeType`, `hasPdfMagicBytes` (→ `UploadContentValidator`), `requestUploadingStatus`, `requestUploadedStatus`, `updateStatus` (→ `UploadStatusClient`), `writeUploadedFile`, `basePathFor`, `storageFor` (→ `UploadStorageResolver`).
- Rewrite `processsRequest()` to build each collaborator inline via its `forType($uploadType)` factory and call it directly:
  ```php
  protected function processsRequest(RequestInterface $request): Response
  {
      try {
          ['type' => $uploadType, 'id' => $uploadId] = $this->extractUploadIdentifiers($request);

          $file = ($request->uploadedFiles()['file'] ?? null);
          $reason = UploadContentValidator::forType($uploadType)->rejectionReasonFor($file);
          if ($reason !== null) {
              throw new UnprocessableUploadException($reason, $file);
          }

          $headers = $request->headers();
          $statusClient = new UploadStatusClient($this->client, $uploadType);
          $filePath = $statusClient->requestUploadingStatus($uploadId, $headers);

          $destination = UploadStorageResolver::forType($uploadType, $this->photosBasePath, $this->filesBasePath)
              ->write($filePath, $file);

          $statusClient->requestUploadedStatus($uploadId, $headers);
      } catch (UnprocessableUploadException $e) {
          return $this->unprocessableEntityResponse($e->getMessage(), $e->file());
      } catch (BackendErrorException $e) {
          return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
      } catch (InvalidArgumentException $e) {
          return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
      }

      return new Response([
          'httpCode' => 200,
          'headers'  => ['Content-Type: application/json'],
          'body'     => json_encode(['file_path' => $destination]),
      ]);
  }
  ```
- Keep `extractUploadIdentifiers()` and `unprocessableEntityResponse()` unchanged. `UploadHandler` ends up with 3 non-getter/setter methods (`processsRequest`, `extractUploadIdentifiers`, `unprocessableEntityResponse`), well under PHPMD's limit.

### Step 5 — Wire up `loader.php`

Edit `proxy/extension/loader.php`: add `require_once` lines for the three new files, grouped with the other `lib/support/` requires and before the existing `require_once __DIR__ . '/lib/handlers/UploadHandler.php';` line (no autoloader in this project — load order matters).

### Step 6 — Tests

- `proxy/extension/tests/handlers/UploadHandlerTest.php` tests exclusively through `handleRequest()` at the `HttpClientInterface` mock boundary, so it should pass unchanged after the extraction — run it to confirm, but no rewrite is expected.
- Add `proxy/extension/tests/support/UploadContentValidatorTest.php`: cover `forType('image')`/`forType('file')` against valid files, wrong mime type, wrong extension, mismatched detected-mime, and (file-only) bad/missing PDF magic bytes — mirroring the structure of `UploadFilenameValidatorTest.php`.
- Add `proxy/extension/tests/support/UploadStatusClientTest.php`: cover `requestUploadingStatus`/`requestUploadedStatus` success and backend-error paths against a mocked `BackendClient`/`HttpClientInterface` — mirroring `BackendClientTest.php`.
- Add `proxy/extension/tests/support/UploadStorageResolverTest.php`: cover `forType('image')`/`forType('file')` resolving the correct base path, and `write()` writing to disk and raising on path-traversal — mirroring `SecurePhotoStorageTest.php`.

## Files to Change

- `proxy/extension/lib/support/UploadContentValidator.php` — new, content/mime validation
- `proxy/extension/lib/support/UploadStatusClient.php` — new, backend status polling
- `proxy/extension/lib/support/UploadStorageResolver.php` — new, per-type storage resolution
- `proxy/extension/lib/handlers/UploadHandler.php` — trimmed to orchestration only
- `proxy/extension/loader.php` — register the three new files, before `UploadHandler.php`'s require line
- `proxy/extension/tests/support/UploadContentValidatorTest.php` — new
- `proxy/extension/tests/support/UploadStatusClientTest.php` — new
- `proxy/extension/tests/support/UploadStorageResolverTest.php` — new
- `proxy/extension/tests/handlers/UploadHandlerTest.php` — verify unchanged behavior, no rewrite expected

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`)
- `proxy`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`)

## Notes

- Keep the exact original check order and return values in `UploadContentValidator::rejectionReasonFor()` (mime → extension → detected-mime → magic-bytes-if-applicable) — this is a pure refactor, not a behavior change.
- `BackendClient` is intentionally left untouched and still constructed once in `UploadHandler`'s constructor — it's shared by `DeleteHandler`, `CacheClearHandler`, and `CacheSizeHandler`, so upload-specific logic must live in the new `UploadStatusClient` wrapper, not in `BackendClient` itself.
- New classes stay in the `Tent\RequestHandlers` namespace despite living under `lib/support/`, matching this codebase's existing convention (directory layout doesn't drive namespace here).
