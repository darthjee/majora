# Issue: Refactor: justify/suppress unused-param and superglobal lint findings in proxy middlewares

## Description
Three PHPMD findings in `proxy/extension/lib/middlewares/` are false positives — each flags behavior that is intentional and already explained in the class's own docblock:

- `SetClientIpMiddleware.php:54` — `UnusedFormalParameter` on `build(array $attributes)`. The docblock already states $attributes is unused, present only to satisfy the base `Middleware::build()` contract.
- `SetClientIpMiddleware.php:68` — `Superglobals` on `processRequest()` reading `$_SERVER['REMOTE_ADDR']`. This is the entire point of the class — setting `X-Forwarded-For` from Tent's own view of the peer address — and is explained at length in the class docblock.
- `TestHeaderMiddleware.php:24` — `UnusedFormalParameter` on `handle(Request $request, Response $response)` (unused $request). This is a sample/demo middleware whose own docblock says it exists to demonstrate the standard `handle($request, $response)` signature.

## Problem
Because these findings keep recurring as open Codacy/PHPMD items, they add noise and make it harder to spot genuinely new findings in the same files.

## Solution
Add native PHPMD `@SuppressWarnings(PHPMD.RuleName)` docblock annotations, referencing the existing docblock rationale, to each of the three findings:

- `SetClientIpMiddleware::build()` — `@SuppressWarnings(PHPMD.UnusedFormalParameter)`
- `SetClientIpMiddleware::processRequest()` — `@SuppressWarnings(PHPMD.Superglobals)`
- `TestHeaderMiddleware::handle()` — `@SuppressWarnings(PHPMD.UnusedFormalParameter)`

This is PHPMD's native, built-in suppression mechanism — it works with Codacy's default phpmd engine as configured in `.codacy.yml` today, no custom ruleset file needed. No $_request-style underscore-prefix rename: PHPMD's UnusedFormalParameter rule does not special-case underscore-prefixed parameter names, so renaming would not actually silence the finding, and no such convention exists elsewhere in this repo. `TestHeaderMiddleware` has no enforced interface/base-class contract for its `handle()` signature (unlike `SetClientIpMiddleware extends Middleware`), but its docblock explicitly says the method exists to demonstrate that standard signature, so keeping both parameters and suppressing is preferred over trimming the signature.

## Benefits
Removes recurring false-positive noise from code-quality reports without weakening real detection elsewhere — each suppression is scoped to a single method and documents why, right where PHPMD flags it.
