# Plan: Refactor: replace deprecated finfo_close() call in UploadContentValidator.php

Issue: [1331-refactor--replace-deprecated-finfo-close---call-in-uploadcontentvalidator-php.md](../issues/1331-refactor--replace-deprecated-finfo-close---call-in-uploadcontentvalidator-php.md)

## Overview
Remove the deprecated `finfo_close($finfo)` call from `UploadContentValidator::detectedMimeType()` in the proxy extension. Confirmed the proxy runtime (`darthjee/tent:0.10.4`) is PHP 8.4.24, so the object-based `finfo` (GC'd automatically, no manual close needed) applies and the removal is safe.

See [proxy.md](proxy.md) for the full plan.
