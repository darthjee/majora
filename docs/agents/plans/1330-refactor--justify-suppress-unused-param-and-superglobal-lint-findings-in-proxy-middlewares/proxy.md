# Proxy Plan: Refactor: justify/suppress unused-param and superglobal lint findings in proxy middlewares

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Suppress the two `SetClientIpMiddleware` findings

In `proxy/extension/lib/middlewares/SetClientIpMiddleware.php`:

- Add `@SuppressWarnings(PHPMD.UnusedFormalParameter)` to the `build(array $attributes)` docblock (lines 45-53), next to the existing `@param $attributes Unused; ...` line — the docblock already explains `$attributes` exists only to satisfy `Middleware::build()`'s contract.
- Add `@SuppressWarnings(PHPMD.Superglobals)` to the `processRequest()` docblock (lines 59-67) — the class-level docblock already explains reading `$_SERVER['REMOTE_ADDR']` is the entire point of this middleware.

Both are PHPMD's native docblock annotation mechanism — no custom PHPMD ruleset file is needed for these to take effect against Codacy's default phpmd engine.

### Step 2 — Suppress the `TestHeaderMiddleware` finding

In `proxy/extension/lib/middlewares/TestHeaderMiddleware.php`, add `@SuppressWarnings(PHPMD.UnusedFormalParameter)` to the `handle(Request $request, Response $response)` docblock (lines 17-23) — do **not** rename `$request` to `$_request`: PHPMD's `UnusedFormalParameter` rule does not special-case underscore-prefixed parameter names (confirmed: no such convention exists anywhere else in this repo, and it would not silence the finding). Keep both parameters as-is; the class's own docblock explains they exist to demonstrate Tent's standard `handle($request, $response)` signature.

## Files to Change

- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php` — add `@SuppressWarnings` annotations to `build()` and `processRequest()`.
- `proxy/extension/lib/middlewares/TestHeaderMiddleware.php` — add `@SuppressWarnings` annotation to `handle()`.

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`) — confirm the added docblock annotations don't trip phpcs formatting rules.
- `proxy`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`) — confirm no behavior changed (docblock-only edit).

## Notes

- PHPMD itself only runs via Codacy in this repo (no CircleCI job runs it), so there is no local command to re-verify the findings clear; the annotations are a scoped, well-documented native PHPMD feature and don't require a ruleset change to take effect.
- Purely docblock-only changes — no runtime behavior changes in either file.
