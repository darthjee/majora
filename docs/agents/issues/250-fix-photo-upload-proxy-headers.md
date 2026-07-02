# Issue: Fix photo upload proxy headers

## Description
`PhotoUploadHandler` (`proxy/extension/lib/PhotoUploadHandler.php`) handles `POST /uploads/:id/submit` by making two backend calls (`PATCH /uploads/:id.json`, once for `status=uploading` and once for `status=uploaded`). Both calls currently forward **all** headers received on the original client request (via `$request->headers()`), only overriding `Content-Type` and `Host`/`X-Forwarded-Host` (the latter two via existing middlewares).

## Problem
Forwarding every incoming header to the backend is unnecessary and leaks client-facing headers (e.g. `Authorization`, `X-Upload-Token`, custom tracing headers) that the backend's upload-status endpoint has no need for. This is also inconsistent with how a minimal, intentional set of headers should be proxied.

## Expected Behavior
Only the following headers should be forwarded to the backend on both PATCH calls (matched case-insensitively, since clients may send header names in varying casing):
- `Host`
- `X-Forwarded-Host`
- `Cookie`
- `X-Skip-Cache`
- `Referer`
- `Accept-Encoding`
- `Accept-Language`
- `Accept`
- `Content-Type` (forced to `application/json`, as it already is today)

Any other header present on the incoming request (e.g. `Authorization`, `X-Upload-Token`) must not be forwarded to the backend.

## Solution
Add a private allow-list filter inline in `PhotoUploadHandler` (a constant/method, not a new Tent middleware) that filters $headers down to the list above — case-insensitively — before both calls to `$this->httpClient->request()` in `updateStatus()`. The existing `Content-Type` override and the `Host`/`X-Forwarded-Host` middlewares stay as-is; the filter just needs to let those two keys through alongside the rest of the allow-list.

## Benefits
- Avoids forwarding sensitive or irrelevant client headers to the backend.
- Makes the set of headers reaching the backend explicit and auditable.
