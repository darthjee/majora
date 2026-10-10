# Refactor: replace conditional require with include in cache_cleanup_map.php

## Context

Codacy's PHP_CodeSniffer scan (`PEAR.Files.IncludingFile`, BestPractice, Info severity) flags 9 lines in `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` (lines 15-23) where a file is conditionally included using `require`/`require_once`. PEAR convention (and PHP best practice generally) is to use `include`/`include_once` for conditional includes, reserving `require` for files that must always be present, since a missing conditionally-required file causes a fatal error instead of a recoverable warning.

## What needs to be done

Proxy: review `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php:15-23` and switch the conditional includes from `require`/`require_once` to `include`/`include_once`, confirming the cache-cleanup map still builds correctly when an optional file is absent.

## Acceptance criteria

- [ ] The 9 flagged lines use `include`/`include_once` instead of `require`/`require_once`
- [ ] Cache-cleanup behavior is unchanged when all files are present
- [ ] Codacy's PHPCS `PEAR.Files.IncludingFile` finding clears for this file
