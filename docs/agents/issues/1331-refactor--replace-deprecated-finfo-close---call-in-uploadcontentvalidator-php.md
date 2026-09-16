# Issue: Refactor: replace deprecated finfo_close() call in UploadContentValidator.php

## Description
A Codacy code-quality finding (PHPCS `Generic.PHP.DeprecatedFunctions`) flags `finfo_close()` as deprecated at `proxy/extension/lib/support/UploadContentValidator.php:158`, inside the private method `detectedMimeType()`:

```php
$finfo = finfo_open(FILEINFO_MIME_TYPE);
if ($finfo === false) {
    return null;
}

$mimeType = finfo_file($finfo, $tmpName);
finfo_close($finfo);

return ($mimeType === false ? null : $mimeType);
```

As of PHP 8.1+, `finfo` resources are objects (`finfo` class) and no longer need manual closing — the object is garbage-collected normally like any other object, and `finfo_close()` is now a deprecated no-op wrapper kept only for backward compatibility.

## Problem
Calling a deprecated function triggers a deprecation notice/warning under modern PHP and adds noise to lint/Codacy results without providing any behavioral benefit, since the underlying resource-closing semantics it once provided no longer apply.

## Solution
Remove the `finfo_close($finfo)` call from `detectedMimeType()` in `proxy/extension/lib/support/UploadContentValidator.php`.

There is no `composer.json` in the repo to check a minimum PHP version against. The proxy runs inside the `darthjee/tent:0.10.4` Docker image (per `docker-compose.yml` / `.circleci/config.yml`), and `docker run --rm darthjee/tent:0.10.4 php -v` confirms that image bundles PHP 8.4.24 — well past the 8.1 threshold where `finfo` became an object and manual closing stopped being necessary — so the removal is safe.

No other `finfo_open`/`finfo_file`/`finfo_close` call sites exist elsewhere in `proxy/` (only doc-comment mentions in test files, not code). Note also that `proxy/phpcs.xml` (the ruleset the local/CI `proxy_extension_tests` job runs) does not currently include `Generic.PHP.DeprecatedFunctions`, so this finding is Codacy-only and won't be locally reproducible via `docker-compose run proxy_tests` until/unless that sniff is added — out of scope for this issue.

## Benefits
- Removes a deprecated-function lint finding.
- Keeps the codebase aligned with PHP 8.1+ object-based `finfo` semantics.
