# Plan: Refactor: replace conditional require with include in cache_cleanup_map.php

Issue: [1364-refactor-replace-conditional-require-with-include-in-cache-cleanup-map-php.md](../../issues/1364-refactor-replace-conditional-require-with-include-in-cache-cleanup-map-php.md)

## Overview

Satisfy Codacy's PHPCS `PEAR.Files.IncludingFile` finding on `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` by switching the 9 flagged `require` statements to `include`, with no behavioral change expected.

See [proxy.md](proxy.md) for the full plan.
