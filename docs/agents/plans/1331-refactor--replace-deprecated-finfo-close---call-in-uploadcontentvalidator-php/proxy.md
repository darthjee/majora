# Proxy Plan: Refactor: replace deprecated finfo_close() call in UploadContentValidator.php

Main plan: [plan.md](plan.md)

## Overview
A Codacy finding (PHPCS `Generic.PHP.DeprecatedFunctions`) flags `finfo_close()` at `proxy/extension/lib/support/UploadContentValidator.php:158`. As of PHP 8.1+, `finfo` is an object (not a resource), so `finfo_close()` is a deprecated no-op — the instance is garbage-collected normally.

## Context
- The proxy runs inside the `darthjee/tent:0.10.4` Docker image (per `docker-compose.yml` and `.circleci/config.yml`); `docker run --rm darthjee/tent:0.10.4 php -v` confirms PHP 8.4.24, well past the 8.1 threshold, so the removal is safe.
- `proxy/extension/lib/support/UploadContentValidator.php` is the only file in `proxy/` with `finfo_open`/`finfo_file`/`finfo_close` calls; no other call sites need the same treatment. (Two test files mention `finfo_file` only in doc-comments, not code.)
- `proxy/phpcs.xml` (the ruleset run by CI/`docker-compose run proxy_tests`) currently only configures `PEAR.Functions.FunctionCallSignature` and `Squiz.Functions.FunctionDeclarationArgumentSpacing` — it does not include `Generic.PHP.DeprecatedFunctions`, so this specific finding won't reproduce locally via phpcs; it's a Codacy-only finding. Adding that sniff is out of scope for this issue.

## Implementation Steps

### Step 1 — Remove the deprecated finfo_close() call
In `detectedMimeType()`, delete the `finfo_close($finfo);` line (currently line 158). No replacement is needed — the `finfo` object goes out of scope and is garbage-collected when the method returns. Behavior of `finfo_open`/`finfo_file` and the method's return value are unchanged.

## Files to Change
- `proxy/extension/lib/support/UploadContentValidator.php` — remove the `finfo_close($finfo);` call from `detectedMimeType()`.

## CI Checks
- `proxy/`: `docker-compose run --rm proxy_tests` (runs `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` then `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests`) (CI job: `proxy_extension_tests`)

## Notes
- Existing tests in `proxy/extension/tests/support/UploadContentValidatorTest.php` exercise `detectedMimeType()` indirectly through `rejectionReasonFor()`'s public behavior; no test changes are expected, but re-run the suite to confirm no regression.
- This finding is not currently caught by the local `phpcs.xml`; verification relies on manual/Codacy re-scan rather than a local lint failure disappearing.
