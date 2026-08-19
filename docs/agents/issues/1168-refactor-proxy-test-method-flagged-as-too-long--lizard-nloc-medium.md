# Issue: Refactor proxy test method flagged as too long (Lizard nloc-medium)

## Description
Sub-issue of #1152. Codacy's `Lizard` complexity analyzer flags one PHP test method in `proxy/extension/tests/handlers/UploadHandlerTest.php` as exceeding the 50-NLOC-per-method limit.

## Problem
`testOnlyAllowListedHeadersAreForwardedToBackend` (line 319) is 53 lines: it builds an input headers array, builds the expected-forwarded-headers array, sets up a two-call mock expectation on `HttpClientInterface::request` with response fixtures, invokes the handler, and asserts the response code/body — all inline in one method.

Several other methods in the same file (`testValidImageUploadReturnsTwoHundred`, `testValidFileUploadReturnsTwoHundred`, `testFinalizePatchUrlIncludesUploadType`, `testTrailingSlashOnHostDoesNotProduceDoubleSlash`, `testAllowListedHeadersAreMatchedCaseInsensitively`) repeat the same "mock two consecutive `request()` calls returning 200 fixtures, then assert `httpCode()`/decoded body" block — this is the duplicated logic worth extracting, not a per-header loop as originally assumed.

## Expected Behavior
The flagged method drops back under its 50-NLOC limit by extracting the duplicated setup/assertion block into a well-named shared helper method, per the Definition of Done strengthened in #1152. The helper is reused across the other test methods in the file that share the same duplicated block, not just the flagged one, since the point of #1152's stricter Definition of Done is eliminating excessive duplication, not a mechanical single-method line split.

## Solution
### Occurrence (1)

- `proxy/extension/tests/handlers/UploadHandlerTest.php`
  - line 319: `UploadHandlerTest::testOnlyAllowListedHeadersAreForwardedToBackend` has 53 lines (limit 50)

Extract the repeated "expect two forwarded `request()` calls with given headers, then assert 200 + decoded body" block into a shared private helper (e.g. `assertForwardedWithHeaders($httpClient, $handler, $request, array $expectedHeaders, array $expectedBody)`), and reuse it in:
- `testOnlyAllowListedHeadersAreForwardedToBackend` (the flagged occurrence)
- `testValidImageUploadReturnsTwoHundred`
- `testValidFileUploadReturnsTwoHundred`
- `testFinalizePatchUrlIncludesUploadType`
- `testTrailingSlashOnHostDoesNotProduceDoubleSlash`
- `testAllowListedHeadersAreMatchedCaseInsensitively`

Each of these currently repeats the same mock-expectation-and-assertion shape inline; only behavior/fixtures differ per test.

## Benefits
Improved readability and maintainability; reduces duplication across the test file (not just the one flagged method); passes the Codacy Lizard check.
