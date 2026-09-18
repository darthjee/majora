# Proxy Plan: Refactor: bracket unbracketed operations flagged by PHPCS across proxy/

Main plan: [plan.md](plan.md)

## Overview

Codacy's PHP_CodeSniffer scan (`Squiz.Formatting.OperatorBracket`, CodeStyle, Info severity) flags operations across `proxy/` that mix operators (or repeat the same operator) without an enclosing pair of parentheses. Verified against `proxy/phpcs.xml` with this sniff enabled ad hoc (it is not currently part of the checked-in ruleset), the real, current finding set is **32 individual sniff errors across 16 lines in 13 files** — a superset of the 14 locations originally listed on the issue (see Notes).

The fix is mechanical and behavior-preserving: wrap the full flagged expression on each line in one enclosing `( ... )`. This was confirmed both by inspecting the flagged expressions and by running `phpcbf` with the sniff enabled, which produced exactly this shape for every finding.

## Implementation Steps

### Step 1 — Wrap all flagged operations in parentheses

Apply the following change at each location (verified via `phpcbf` against the actual current file contents — these are the exact, complete diffs, not a partial or guessed set):

**`proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php`** (lines 48–49)
```diff
-            $targets = $group['targets'] ?? [];
-            $routes = $group['routes'] ?? [];
+            $targets = ($group['targets'] ?? []);
+            $routes = ($group['routes'] ?? []);
```

**`proxy/extension/lib/support/SecurePhotoStorage.php`** (line 126)
```diff
-            && strncmp($normalizedDir, $normalizedBase . '/', strlen($normalizedBase) + 1) !== 0
+            && strncmp($normalizedDir, $normalizedBase . '/', (strlen($normalizedBase) + 1)) !== 0
```

**`proxy/extension/lib/support/BackendClient.php`** (line 120)
```diff
-        if ($this->isGzipEncoded($result['headers'] ?? [])) {
+        if ($this->isGzipEncoded(($result['headers'] ?? []))) {
```

**`proxy/extension/lib/cache/PrivateRequestHasher.php`** (line 58)
```diff
-        $token = $headers[strtolower($this->headerName)] ?? '';
+        $token = ($headers[strtolower($this->headerName)] ?? '');
```

**`proxy/extension/lib/support/PathTraversalGuard.php`** (line 67)
```diff
-            && strncmp($realPath, $realBase . '/', strlen($realBase) + 1) !== 0
+            && strncmp($realPath, $realBase . '/', (strlen($realBase) + 1)) !== 0
```

**`proxy/dev_configuration/rules/photos.php`** (line 17), **`proxy/dev_configuration/rules/domain.php`** (line 17), **`proxy/dev_configuration/rules/files.php`** (line 17), **`proxy/prod_configuration/rules/files.php`** (line 17), **`proxy/prod_configuration/rules/domain.php`** (line 17), **`proxy/prod_configuration/rules/photos.php`** (line 17) — all six identical:
```diff
-            'maxAgeSeconds' => 60 * 60 * 24 * 7
+            'maxAgeSeconds' => (60 * 60 * 24 * 7)
```

**`proxy/dev_configuration/rules/frontend.php`** — **two** occurrences, lines 43 and 64 (the issue only listed line 43; line 64 is the same pattern in the second `buildRule()` block in this file):
```diff
-                'maxAgeSeconds' => 60 * 60 * 24
+                'maxAgeSeconds' => (60 * 60 * 24)
```
(applies identically at both lines 43 and 64)

**`proxy/prod_configuration/rules/frontend.php`** — **two** occurrences, lines 17 and 39 (the issue only listed line 17; line 39 is the same pattern in the second `buildRule()` block in this file):
```diff
-            'maxAgeSeconds' => 60 * 60 * 24
+            'maxAgeSeconds' => (60 * 60 * 24)
```
(applies identically at both lines 17 and 39)

Do **not** modify `proxy/phpcs.xml` to add the `Squiz.Formatting.OperatorBracket` rule — the issue only asks to fix the flagged code, not to newly enforce this sniff going forward. Verification below uses the sniff ad hoc, without touching the checked-in ruleset.

## Files to Change

- `proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php` — bracket 2 `??` expressions
- `proxy/extension/lib/support/SecurePhotoStorage.php` — bracket 1 `strlen(...) + 1` sub-expression
- `proxy/extension/lib/support/BackendClient.php` — bracket 1 `??` expression
- `proxy/extension/lib/cache/PrivateRequestHasher.php` — bracket 1 `??` expression
- `proxy/extension/lib/support/PathTraversalGuard.php` — bracket 1 `strlen(...) + 1` sub-expression
- `proxy/dev_configuration/rules/photos.php` — bracket 1 `*` chain
- `proxy/dev_configuration/rules/domain.php` — bracket 1 `*` chain
- `proxy/dev_configuration/rules/files.php` — bracket 1 `*` chain
- `proxy/dev_configuration/rules/frontend.php` — bracket 2 `*` chains (lines 43, 64)
- `proxy/prod_configuration/rules/files.php` — bracket 1 `*` chain
- `proxy/prod_configuration/rules/domain.php` — bracket 1 `*` chain
- `proxy/prod_configuration/rules/photos.php` — bracket 1 `*` chain
- `proxy/prod_configuration/rules/frontend.php` — bracket 2 `*` chains (lines 17, 39)

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`, step "Check PHP Lint") — passes both before and after this change, since `Squiz.Formatting.OperatorBracket` is not in the checked-in ruleset. It does not by itself verify the acceptance criteria; use the ad hoc command in Notes for that.
- `proxy`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`, step "Tests") — must still pass unchanged (204 tests, 316 assertions as of this plan); this is a pure formatting change with no behavior difference.

## Notes

- **The issue's location list is incomplete.** It lists 14 locations across 13 files, but the current code has 16 flagged lines across the same 13 files (32 individual sniff errors, since PHPCS counts each operator on a line separately — e.g. `60 * 60 * 24 * 7` triggers 3 errors on one line). The two missing locations are `proxy/dev_configuration/rules/frontend.php:64` and `proxy/prod_configuration/rules/frontend.php:39` — each is a second, later `'maxAgeSeconds' => 60 * 60 * 24` occurrence in a second `Configuration::buildRule()` block in the same file, identical in shape to the one already listed at line 43 / 17 respectively. Implement and verify against all 16 lines, not just the 14 originally listed, so the acceptance criterion ("0 `Squiz.Formatting.OperatorBracket` findings") is actually met.
- **How this was verified**: `Squiz.Formatting.OperatorBracket` is not part of `proxy/phpcs.xml` today, so it can't be checked with the project's normal lint command. Verification requires enabling the sniff ad hoc, e.g. by running phpcs/phpcbf (via the `darthjee/tent-test:0.10.4` CI image, matching the `proxy_extension_tests` job) against a copy of `proxy/` whose `phpcs.xml` temporarily adds `<rule ref="Squiz.Formatting.OperatorBracket"/>` (keep the existing `<exclude-pattern>*/extension/tests/*</exclude-pattern>` so test fixtures aren't flagged — one test file, `SetClientIpMiddlewareTest.php:24`, does trigger this sniff but is out of scope, matching `.codacy.yml`'s existing `phpcs.exclude_paths` for `proxy/extension/tests/**`). Running `phpcbf` with that temporary ruleset against the current code reproduces exactly the diffs listed in Step 1, and a full `phpunit` run afterwards is green (204 tests, 316 assertions) — confirming the change is safe and complete.
- Every fix is the same shape: wrap the entire flagged expression in one enclosing `( ... )`. No logic, precedence, or output changes — `phpcbf`'s auto-fix (which uses this exact shape) was used to produce and cross-check the diffs above.
