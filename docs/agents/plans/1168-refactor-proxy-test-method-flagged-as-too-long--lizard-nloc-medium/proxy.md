# Proxy Plan: Refactor proxy test method flagged as too long (Lizard nloc-medium)

Main plan: [plan.md](plan.md)

## Overview

`UploadHandlerTest::testOnlyAllowListedHeadersAreForwardedToBackend` (line 319) is 53 NLOC, 3 over the Lizard limit of 50. Bring it back under the limit by extracting the duplicated "mock two consecutive forwarded `request()` calls, then assert the response" block into a shared private helper, and reuse that helper across the other test methods in the same file that repeat the identical shape — per #1152's strengthened Definition of Done (refactor tests with excessive duplication, not just mechanical line-splitting).

## Implementation Steps

### Step 1 — Inventory the duplicated shape

All of the following methods in `proxy/extension/tests/handlers/UploadHandlerTest.php` build a request, mock `HttpClientInterface::request()` to return two consecutive `200` fixtures (an "uploading" PATCH followed by an "uploaded" PATCH), call `$handler->handleRequest($request)`, and then assert on the response — but they are **not** all identical:

- `testValidImageUploadReturnsTwoHundred` (~169) — no `->with(...)` constraint; asserts `200`, `Content-Type: application/json` header present, decoded body equals `photosDir` path.
- `testValidFileUploadReturnsTwoHundred` (~205) — same shape as above but `filesDir` path.
- `testFinalizePatchUrlIncludesUploadType` (~241) — constrains `->with('PATCH', <url>, anything(), anything())`; asserts only `200` (no body/content-type check).
- `testTrailingSlashOnHostDoesNotProduceDoubleSlash` (~276) — same `->with('PATCH', <url>, ...)` shape as above, custom handler instance.
- `testOnlyAllowListedHeadersAreForwardedToBackend` (319, **the flagged occurrence**) — constrains `->with(anything(), anything(), $expectedHeaders, anything())`; asserts `200` + decoded body.
- `testAllowListedHeadersAreMatchedCaseInsensitively` (~386) — same shape as the flagged occurrence.

The common core across all six is: "expect exactly 2 calls to `request()`, returning `{httpCode:200, body:<fixture>, headers:[]}` twice, in that order." What varies is (a) whether/what `->with(...)` constrains, and (b) which post-call assertions run (content-type header, decoded body, or just the status code).

### Step 2 — Extract shared helper(s)

Add a private helper (or a small pair of helpers if that reads more cleanly) to `UploadHandlerTest` that captures the common mock-expectation shape from Step 1, parameterized for the two axes of variance identified above (e.g. an optional `with(...)` constraint, and the two success-fixture bodies). Do not force a single rigid signature onto all six call sites if that makes any of them awkward or unclear — a couple of thin, well-named helpers (e.g. one for setting up the two-call mock expectation, one for the common response assertions) is preferable to one helper with many optional parameters.

Preserve each test's exact current behavior and assertions — this is a structural extraction, not a behavior change.

### Step 3 — Apply the helper(s) to all six methods

Refactor each of the six methods listed in Step 1 to use the new helper(s). `testOnlyAllowListedHeadersAreForwardedToBackend` must end up at or under 50 NLOC as a result.

### Step 4 — Verify

Confirm the flagged method is back under the 50-NLOC Lizard limit, and that all tests still pass with unchanged assertions/semantics (see CI Checks below).

## Files to Change

- `proxy/extension/tests/handlers/UploadHandlerTest.php` — extract shared helper(s); refactor `testOnlyAllowListedHeadersAreForwardedToBackend`, `testValidImageUploadReturnsTwoHundred`, `testValidFileUploadReturnsTwoHundred`, `testFinalizePatchUrlIncludesUploadType`, `testTrailingSlashOnHostDoesNotProduceDoubleSlash`, and `testAllowListedHeadersAreMatchedCaseInsensitively` to use them.

## CI Checks

- `proxy/`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests` — runs `phpcs` against `proxy/phpcs.xml` then `phpunit`)

## Notes

- The six methods are not byte-identical in shape (see Step 1) — resist collapsing them into one over-parameterized helper; a couple of focused helpers is fine.
- Only `testOnlyAllowListedHeadersAreForwardedToBackend` is currently flagged by Lizard; the other five are included per the user's explicit choice of the broader-dedup option during discussion of this issue, not because they're individually over the limit.
