# Plan: Add logs to verify unprocessable image

Issue: [229-add-logs-to-verify-unprocessable-image.md](../issues/229-add-logs-to-verify-unprocessable-image.md)

## Overview

`PhotoUploadHandler::isValidImage()` currently returns a plain boolean, so a
rejected upload (`422 Unprocessable Entity`) carries no information about
*why* it was rejected, either in the logs or in the HTTP response. This plan
refactors the validation to surface a specific rejection reason, logs it via
`Tent\Log\Logger::warn()`, and returns a structured JSON `422` body carrying
the same detail.

## Context

- File: `proxy/extension/PhotoUploadHandler.php`.
- `isValidImage()` (around line 153) independently checks MIME type and file
  extension against allow-lists and returns `true` only if both pass.
- The caller (`processsRequest()`, around line 88) currently does:
  ```php
  $files = $request->uploadedFiles();
  $file = $files['file'] ?? null;
  if ($file === null || !$this->isValidImage($file)) {
      return new Response(['httpCode' => 422, 'body' => 'Unprocessable Entity']);
  }
  ```
- `Tent\Log\Logger` (provided by the `darthjee/tent:0.8.1` base image at
  `/var/www/html/lib/log/Logger.php`) only exposes single-string-argument
  static methods — `debug()`, `info()`, `warn(string $message)`,
  `error()` — there is no structured/array-context overload. Existing calls
  elsewhere in Tent's own lib code (e.g.
  `lib/service/BackgroundRefresher.php`) follow the convention
  `'[tag] - message — key: value, key2: value2'`; this plan follows the same
  style, using the tag `[upload]`.
- `Tent\Models\Response` accepts a `headers` array of raw header lines (e.g.
  `'Content-Type: application/json'`) via its constructor — used to mark the
  new JSON body correctly, unlike the existing plain-text `400`/`500`
  responses in this same handler, which are left untouched.

## Implementation Steps

### Step 1 — Determine the rejection reason instead of a boolean

Replace `isValidImage(array $file): bool` with a method that returns the
specific reason a file is rejected, or `null` when it is valid, e.g.:

```php
private function imageRejectionReason(?array $file): ?string
{
    if ($file === null) {
        return 'missing_file';
    }

    $allowedMimeTypes  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    $mimeType = $file['type'] ?? '';
    $ext      = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));

    if (!in_array($mimeType, $allowedMimeTypes, true)) {
        return 'unsupported_mime_type';
    }

    if (!in_array($ext, $allowedExtensions, true)) {
        return 'unsupported_extension';
    }

    return null;
}
```

Mime type is checked before extension (matching the issue's own example,
where a `.pdf` file with `Content-Type: application/pdf` is reported as
`unsupported_mime_type`) — both checks still run independently per file, but
when both would fail, the MIME check wins.

### Step 2 — Log and return the structured 422 response

In `processsRequest()`, replace the validation block with:

```php
$files = $request->uploadedFiles();
$file = $files['file'] ?? null;
$reason = $this->imageRejectionReason($file);

if ($reason !== null) {
    $filename = $file['name'] ?? '';
    $mimeType = $file['type'] ?? '';

    Logger::warn(
        '[upload] - rejected image upload, reason: ' . $reason .
        ', filename: ' . $filename . ', mimeType: ' . $mimeType
    );

    return new Response([
        'httpCode' => 422,
        'headers'  => ['Content-Type: application/json'],
        'body'     => json_encode([
            'error'    => 'Unprocessable Entity',
            'reason'   => $reason,
            'filename' => $filename,
            'mimeType' => $mimeType,
        ]),
    ]);
}
```

Add `use Tent\Log\Logger;` to the top of the file alongside the existing
`use` statements.

### Step 3 — Update tests

In `proxy/extension/tests/PhotoUploadHandlerTest.php`:

- Update `testInvalidFileTypeReturnsUnprocessableEntity()` to assert on the
  new JSON body shape (`error`, `reason: 'unsupported_mime_type'`,
  `filename: 'doc.pdf'`, `mimeType: 'application/pdf'`) instead of the old
  plain-text body, e.g. via `json_decode($response->body(), true)`.
- Add a case for a missing file (no `file` entry at all) asserting
  `reason: 'missing_file'` and empty `filename`/`mimeType`.
- Add a case for a valid MIME type with an unsupported extension (e.g.
  `type => 'image/jpeg'`, `name => 'photo.txt'`) asserting
  `reason: 'unsupported_extension'`.
- Optionally assert the `Content-Type: application/json` header is present
  on the `422` response via `$response->headers()`.

`Tent\Log\Logger` does not need to be mocked — `LoggerInstance::log()`
writes to PHP's `error_log()`, which is harmless in tests and requires no
stub (see `tests/bootstrap.php`, which loads the real Tent framework).

## Files to Change

- `proxy/extension/PhotoUploadHandler.php` — replace `isValidImage()` with
  `imageRejectionReason()`, add the `Logger::warn()` call, and return a
  structured JSON `422` body with `Content-Type: application/json`.
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — update the existing
  invalid-file-type test for the new JSON body shape and add coverage for
  `missing_file` and `unsupported_extension`.

## Notes

- No other caller of `isValidImage()` exists outside this file, so the
  rename is safe.
- The `400 Bad Request` and `500 Internal Server Error` responses elsewhere
  in this handler are out of scope and left as plain text, per the issue.
- There is currently no CircleCI job that runs `proxy/extension`'s PHPUnit
  suite (`docker-compose run proxy_tests`) — verify locally only; this plan
  does not add one, as that would be an `infra` concern outside this issue's
  scope.
