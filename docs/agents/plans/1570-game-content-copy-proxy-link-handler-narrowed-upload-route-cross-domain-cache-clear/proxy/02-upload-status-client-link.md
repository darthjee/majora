# UploadStatusClient: link start and failed status
Add the two backend calls the link handler needs. The existing methods are unchanged.

- `requestLinkStartStatus(string $uploadId, array $headers): array{file_path: string, source_path: string}`:
  - sends `status=uploading`;
  - a non-200 response throws `BackendErrorException` with the backend's code and body, so a `403`/`404` is relayed as-is;
  - a 200 response missing either non-empty string field throws `BackendErrorException(500, 'Internal Server Error')`.
- `requestFailedStatus(string $uploadId, string $error, array $headers): void`:
  - sends `{"status":"failed","error":"<code>"}`;
  - a non-200 response throws `BackendErrorException`.
- Generalize the private `updateStatus()` to accept extra body fields, e.g. `array $extra = []` merged into the JSON body. The forwarded-header allow-list (`X-Upload-Token`) stays the same.

## Files to Change
- `proxy/extension/lib/support/UploadStatusClient.php` — two new methods; `updateStatus()` accepts extra body fields.
- `proxy/extension/tests/support/UploadStatusClientTest.php` — tests:
  - link start returns both paths;
  - missing `source_path` or `file_path` → 500;
  - a `403`/`404` is relayed;
  - the failed call sends the `error` field;
  - a non-200 failed call throws.
