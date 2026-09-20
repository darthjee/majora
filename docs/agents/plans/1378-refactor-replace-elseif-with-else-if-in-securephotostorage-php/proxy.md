# Proxy Plan: Refactor: replace ELSEIF with ELSE IF in SecurePhotoStorage.php

Main plan: [plan.md](plan.md)

## Overview
Codacy's PHPCS `Squiz.ControlStructures.ElseIfDeclaration` sniff ("Usage of ELSEIF not allowed; use ELSE IF instead") flags the only `elseif` in `proxy/`. The fix is purely syntactic, with no behavior change.

## Context
`SecurePhotoStorage.php:158` sits inside the `..` segment handling of the path normalizer: `} elseif (!$isAbsolute) {`. A repo-wide grep finds no other `elseif` under `proxy/`.

## Implementation Steps

### Step 1 — Replace `elseif` with `else if`
Change `} elseif (!$isAbsolute) {` to `} else if (!$isAbsolute) {` at line 158. Leave the surrounding braces and logic untouched.

## Files to Change
- `proxy/extension/lib/support/SecurePhotoStorage.php` — line 158: `elseif` → `else if`

## CI Checks
- `proxy`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests`)
- `proxy`: `docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c 'find /repo/proxy -name "*.php" -print0 | xargs -0 -n1 php -l'` (PHP lint)

## Notes
- After merge, confirm Codacy's finding clears for this file.
