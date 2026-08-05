# Plan: Refactor CacheSizeHandler

Issue: [993-refactor-cachesizehandler.md](../issues/993-refactor-cachesizehandler.md)

## Overview

Extract the cache-directory sizing logic out of `CacheSizeHandler` into a generic, pluggable
"directory size" abstraction (`DirectorySizeCalculator` + a strategy registry), with two
strategies: a new `du -sb`-based strategy for Linux and the existing PHP walk kept as a fallback
strategy. `CacheSizeHandler` becomes a thin caller of the new orchestrator, selected via a new
`cache_size_tool` config param. This is proxy-only work — no other layer is involved.

## Context

`proxy/extension/lib/handlers/CacheSizeHandler.php::cacheSize()` currently walks the cache folder
file-by-file with `RecursiveIteratorIterator` + `SplFileInfo::getSize()` (one `stat()` syscall per
file). The cache folder holds many small files, so this is slow specifically because of file
count. Since the server runs on Linux, shelling out to `du -sb` lets the OS compute the total far
more efficiently. The issue asks for this to be built as a reusable "size of a directory"
abstraction (not cache-specific), with an injectable shell-executor seam for deterministic testing
of the `du` path, mirroring the `HttpClientInterface` pattern already used by `BackendClient`.

## Implementation Steps

### Step 1 — Add `ShellExecutorInterface` and `NativeShellExecutor`

Create `proxy/extension/lib/support/ShellExecutorInterface.php`:

```php
namespace Tent\RequestHandlers;

interface ShellExecutorInterface
{
    /** @return array{output: string[], exitCode: int} */
    public function exec(string $command): array;
}
```

Create `proxy/extension/lib/support/NativeShellExecutor.php`, the real implementation, wrapping
PHP's `exec(string $command, array &$output, int &$exitCode)`.

### Step 2 — Add `ShellCommandFailedException`

Create `proxy/extension/lib/exceptions/ShellCommandFailedException.php`, alongside
`BackendErrorException`/`UnprocessableUploadException` (same namespace, same flat-file
convention). Give it a constructor that captures enough context to be useful in a message (e.g.
the command and exit code) — follow the existing exception classes' shape/doc-comment style.

### Step 3 — Add the strategy interface and both strategies

- `proxy/extension/lib/support/DirectorySizeStrategyInterface.php` — single method
  `sizeOf(string $path): int`.
- `proxy/extension/lib/support/DuDirectorySizeStrategy.php` — implements the interface; takes an
  optional `ShellExecutorInterface` in its constructor (`?ShellExecutorInterface $shell = null`,
  defaulting to `new NativeShellExecutor()`, same pattern as `BackendClient`'s
  `HttpClientInterface` seam). `sizeOf()` runs `du -sb ' . escapeshellarg($path)`, throws
  `ShellCommandFailedException` when `exitCode !== 0` or `output` is empty, otherwise parses the
  numeric byte-count prefix (`du` output is `"<bytes>\t<path>"`) from the first output line and
  returns it as an `int`.
- `proxy/extension/lib/support/PhpWalkDirectorySizeStrategy.php` — implements the interface;
  `sizeOf()` holds exactly the current `RecursiveIteratorIterator`/`RecursiveDirectoryIterator`
  walk moved verbatim out of `CacheSizeHandler::cacheSize()` (including the `is_dir()` guard
  returning `0` for a missing/empty directory).

### Step 4 — Add the strategy registry and orchestrator

- `proxy/extension/lib/support/DirectorySizeStrategyRegistry.php` — a simple map from tool
  identifier to strategy class/factory, e.g. a `const MAP = ['du' => DuDirectorySizeStrategy::class,
  'php_walk' => PhpWalkDirectorySizeStrategy::class]` plus a static `resolve(string $tool):
  DirectorySizeStrategyInterface` (or similar) that instantiates the right class. Keep it a plain
  map/lookup, no dependency-injection framework — consistent with the rest of this codebase.
- `proxy/extension/lib/support/DirectorySizeCalculator.php` — the orchestrator. Constructor takes
  the configured tool name (string); `sizeOf(string $path): int` looks up the strategy via the
  registry and delegates to its `sizeOf()`. This is the class `CacheSizeHandler` (and future
  callers) depend on — it owns "return the size of a directory," not "how."

### Step 5 — Wire `CacheSizeHandler` to the new orchestrator

- Add a `cachesizeTool`/`cacheSizeTool`-style constructor param (name it consistently with the
  existing `cachePath` property casing) and build a `DirectorySizeCalculator` from it, OR accept
  an already-built `DirectorySizeCalculator` directly in the constructor (preferred — mirrors how
  `CacheSizeHandlerTest` will need to inject a fake calculator per the issue's testing strategy).
  Concretely: add a `?DirectorySizeCalculator $calculator = null` constructor param, defaulting to
  `new DirectorySizeCalculator($cacheSizeTool)` built from a new `string $cacheSizeTool` param.
- `build()` reads the new `cache_size_tool` param from `$params` (with a sensible default — match
  whatever the existing `host`/`cache_path` params' `?? ''`-style defaulting convention is; using
  `'php_walk'` as the code-level default is reasonable so an unconfigured environment doesn't
  silently try to shell out).
- Replace the private `cacheSize()` method's body with a delegation to
  `$this->calculator->sizeOf($this->cachePath)`. Remove the now-unused `RecursiveDirectoryIterator`
  /`RecursiveIteratorIterator`/`SplFileInfo` imports and the `is_dir()` guard (now owned by
  `PhpWalkDirectorySizeStrategy`; `DirectorySizeCalculator`/strategies are responsible for handling
  a missing path however each strategy needs to — `du -sb` on a non-existent path is itself a
  non-zero-exit failure, which is correct per the issue's "no silent fallback" rule).
- Keep `processsRequest()`'s staff-gating and response-shaping untouched.

### Step 6 — Config wiring

- `proxy/prod_configuration/rules/cache.php` — add `'cache_size_tool' => 'du'` to the handler's
  params array.
- `proxy/dev_configuration/rules/cache.php` — add `'cache_size_tool' => 'php_walk'` to the
  handler's params array.

### Step 7 — `loader.php`

Add `require_once` lines for the seven new files, in dependency order, before the existing
`require_once __DIR__ . '/lib/handlers/CacheSizeHandler.php';` line:

```
lib/exceptions/ShellCommandFailedException.php
lib/support/ShellExecutorInterface.php
lib/support/NativeShellExecutor.php
lib/support/DirectorySizeStrategyInterface.php
lib/support/DuDirectorySizeStrategy.php
lib/support/PhpWalkDirectorySizeStrategy.php
lib/support/DirectorySizeStrategyRegistry.php
lib/support/DirectorySizeCalculator.php
```

### Step 8 — Tests

- `proxy/extension/tests/support/ShellExecutorTest.php` (or fold into
  `DuDirectorySizeStrategyTest.php` if `NativeShellExecutor` is trivial enough not to warrant its
  own suite — judgment call, but a minimal smoke test of `NativeShellExecutor::exec()` against a
  real trivial command like `true`/`false` is reasonable) — optional, keep scope tight to what the
  issue asks for.
- `proxy/extension/tests/support/DuDirectorySizeStrategyTest.php` — new. Injects a fake
  `ShellExecutorInterface` (an inline anonymous class or a small test double, following whatever
  convention `BackendClientTest.php`/`CacheSizeHandlerTest.php` already use for fakes/mocks —
  check for a `createMock(ShellExecutorInterface::class)` PHPUnit-mock style vs. a hand-written
  fake). Cover: success path (parses `"12345\t/some/path"` into `int 12345`); non-zero exit code
  throws `ShellCommandFailedException`; empty output throws `ShellCommandFailedException`. No real
  subprocess ever runs in these tests.
- `proxy/extension/tests/support/PhpWalkDirectorySizeStrategyTest.php` — new. Move the filesystem
  fixture logic (`makeCacheFile`, `removeDir`, temp dir setup/teardown) currently in
  `CacheSizeHandlerTest.php` into this new suite, testing `PhpWalkDirectorySizeStrategy::sizeOf()`
  directly (nested files summed correctly, empty/missing directory returns `0`).
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — update. Replace the real temp-dir
  cache-size assertions (`testStaffUserGetsCacheSize`, `testSuperuserAloneGetsCacheSize`,
  `testEmptyCacheDirectoryReturnsZeroSize`, and `makeCacheFile`/`removeDir`/`$cacheDir` fixture
  plumbing) with a fake/mock `DirectorySizeCalculator` injected via the handler's constructor,
  asserting only staff-gating and response-shaping (200 with the calculator's returned size in the
  body, 403 paths, upstream-failure passthrough, header allow-listing, `build()` wiring — now also
  asserting `build()` passes `cache_size_tool` through). No real filesystem fixture needed in this
  file anymore once the walk logic has fully moved out.
- Optionally add a small `DirectorySizeCalculatorTest.php` and/or
  `DirectorySizeStrategyRegistryTest.php` if there's registry-selection logic worth unit-testing in
  isolation (e.g. resolving `'du'`/`'php_walk'` to the right class, and an unknown tool name
  raising a clear error) — keep this proportionate, don't over-test a const map.

## Files to Change

- `proxy/extension/lib/support/ShellExecutorInterface.php` — new interface wrapping `exec()`.
- `proxy/extension/lib/support/NativeShellExecutor.php` — new, real `exec()`-backed implementation.
- `proxy/extension/lib/exceptions/ShellCommandFailedException.php` — new exception for a failed
  shell tool.
- `proxy/extension/lib/support/DirectorySizeStrategyInterface.php` — new strategy interface.
- `proxy/extension/lib/support/DuDirectorySizeStrategy.php` — new `du -sb`-based strategy.
- `proxy/extension/lib/support/PhpWalkDirectorySizeStrategy.php` — new, holds the walk logic moved
  out of `CacheSizeHandler`.
- `proxy/extension/lib/support/DirectorySizeStrategyRegistry.php` — new tool-name → strategy map.
- `proxy/extension/lib/support/DirectorySizeCalculator.php` — new orchestrator, the entry point
  `CacheSizeHandler` calls.
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — replace inline walk with a
  `DirectorySizeCalculator` call; `build()` reads the new `cache_size_tool` param; drop the now
  unused `RecursiveDirectoryIterator`/`RecursiveIteratorIterator`/`SplFileInfo` imports.
- `proxy/prod_configuration/rules/cache.php` — add `'cache_size_tool' => 'du'`.
- `proxy/dev_configuration/rules/cache.php` — add `'cache_size_tool' => 'php_walk'`.
- `proxy/extension/loader.php` — `require_once` the eight new files, in dependency order, before
  `CacheSizeHandler.php`.
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — update to inject a fake
  `DirectorySizeCalculator` instead of exercising a real temp directory.
- `proxy/extension/tests/support/DuDirectorySizeStrategyTest.php` — new.
- `proxy/extension/tests/support/PhpWalkDirectorySizeStrategyTest.php` — new, absorbs the current
  filesystem-fixture tests moved out of `CacheSizeHandlerTest.php`.

## CI Checks

- `proxy`: `docker-compose run --rm proxy_tests` (CI job: `proxy_extension_tests`, which runs
  `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php
  /var/www/html/extension/tests` inside `darthjee/tent-test`).

## Notes

- Per the issue, `du -sb` (not `-h`/`-c`) is required — the API contract is an integer byte count
  in `{"size": <bytes>}`; human-readable/totaled `du` output would need lossy re-parsing.
- No auto-detection of the OS: the tool is always explicitly selected via `cache_size_tool`. A
  misconfigured/failing tool must error out the same way existing `BackendErrorException` failures
  do in this handler — never silently fall back to the other strategy.
- This codebase has no PSR-4 autoloading (`loader.php` requires every file individually) and no
  per-feature subfolders — all new files stay flat under `lib/support/`/`lib/exceptions/` in the
  single `Tent\RequestHandlers` namespace, named generically (`DirectorySize*`, not `CacheSize*`)
  since the issue explicitly calls out reuse beyond the cache handler (e.g. photos/uploaded-files
  size checks) as the motivation for the generic naming.
- Double-check whether this codebase's existing fakes for injectable interfaces
  (`HttpClientInterface` in `BackendClientTest`/`CacheSizeHandlerTest`) use PHPUnit's
  `createMock()` or hand-written fake classes, and follow whichever convention is already
  established for `ShellExecutorInterface` test doubles, for consistency.
