# Issue: Fix file upload API result parsing

## Description
In `PhotoUploadHandler::requestUploadingStatus` (`proxy/extension/lib/PhotoUploadHandler.php:195`), the backend response from the `PATCH /uploads/:id.json` call is parsed with `json_decode`. That response can arrive gzip-compressed, which breaks the parse.

## Problem
Since #246, `PhotoUploadHandler::ALLOWED_FORWARD_HEADERS` includes `Accept-Encoding`, so the browser's original `Accept-Encoding: gzip` header is forwarded as-is to the backend on both internal status-update PATCH calls (`uploading` and `uploaded`). When the backend (or an intermediary such as Cloudflare in front of the backend host) honors that header and compresses the response, the request never gets decompressed: the HTTP client used here (`Tent\Http\CurlHttpClient`) comes from the Tent proxy core, an external dependency outside this repo, and it never sets `CURLOPT_ENCODING` or otherwise decompresses the body. `json_decode` then receives raw gzip bytes, silently returns `null`, and `file_path` resolves to `null`. This trips the "response doesn't include a file_path" branch and the proxy returns a false `BackendErrorException(500)` to the client even though the backend call actually succeeded.

## Solution
Stop forwarding `Accept-Encoding` to the backend on these two internal PATCH calls: their JSON responses are parsed and consumed entirely by the proxy itself and never re-sent to the browser, so there is no reason to allow the backend to compress them. Remove `Accept-Encoding` from `PhotoUploadHandler::ALLOWED_FORWARD_HEADERS` (or explicitly override it, e.g. to `identity`, before calling `updateStatus()`) so the backend always returns an uncompressed body that `json_decode` can parse. Update `PhotoUploadHandlerTest.php` accordingly, since it currently asserts `Accept-Encoding` is forwarded verbatim.

## Benefits
Photo upload submissions no longer fail with a spurious 500 when the backend or an intermediary compresses the status-update response.
