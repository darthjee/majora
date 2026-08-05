# Refactor CacheSizeHandler

## Context

`proxy/extension/lib/handlers/CacheSizeHandler.php`'s `cacheSize()` currently computes the cache
directory size by walking it file-by-file with a `RecursiveIteratorIterator` and calling
`getSize()` (a `stat()` syscall) on every file. The cache folder is made up of many small files,
so this per-file walk is slow precisely because of the sheer file count, not because any single
file is large. Since the server runs on Linux, we can be smarter about this — e.g. shell out to
`du -sb`, which the OS can compute far more efficiently than PHP re-implementing a directory walk.

## What needs to be done

Replace the file-by-file PHP walk with a pluggable sizing-strategy abstraction, generic to "size
of a directory" (not tied to the cache specifically), so it can be reused later for other size
checks (e.g. photos storage, uploaded files) instead of being duplicated.

**Proxy:**

- Add `DirectorySizeCalculator` (`lib/support/DirectorySizeCalculator.php`) — the entry point
  callers (starting with `CacheSizeHandler`) use. Given a configured tool name and a directory
  path, it looks up the responsible strategy via the registry and delegates the byte-count
  computation to it.
- Add `DirectorySizeStrategyInterface` (`lib/support/DirectorySizeStrategyInterface.php`) with a
  single method `sizeOf(string $path): int`, implemented by:
  - `DuDirectorySizeStrategy` (`lib/support/DuDirectorySizeStrategy.php`) — shells out to
    `du -sb <path>` (bytes, not `-h`/`-c` — the API contract is an integer byte count in
    `{"size": <bytes>}`) and parses the numeric prefix of the output.
  - `PhpWalkDirectorySizeStrategy` (`lib/support/PhpWalkDirectorySizeStrategy.php`) — the current
    `RecursiveIteratorIterator`-based walk, kept (not deleted) as an explicitly selectable
    strategy for environments where `du` isn't appropriate (e.g. non-Linux dev/test).
- Add `DirectorySizeStrategyRegistry` (`lib/support/DirectorySizeStrategyRegistry.php`) — a
  class or simple const map associating each tool identifier (`'du'`, `'php_walk'`) with its
  strategy class, so a new tool can be registered later without touching the orchestrator or any
  caller.
- Add `ShellExecutorInterface` (`lib/support/ShellExecutorInterface.php`) — wraps PHP's `exec()`,
  with signature `exec(string $command): array{output: string[], exitCode: int}`.
- Add `NativeShellExecutor` (`lib/support/NativeShellExecutor.php`) — the real implementation of
  `ShellExecutorInterface`.
- Add `ShellCommandFailedException` (`lib/exceptions/ShellCommandFailedException.php`), alongside
  `BackendErrorException`/`UnprocessableUploadException`.
- `DuDirectorySizeStrategy` takes an optional `ShellExecutorInterface` in its constructor
  (defaulting to `NativeShellExecutor`), mirroring the existing `HttpClientInterface` seam used by
  `BackendClient`.
- `CacheSizeHandler` stays as-is at the HTTP layer (staff-gating, response shaping) and simply
  becomes a caller of `DirectorySizeCalculator` instead of doing the walk inline.
- Add a `cache_size_tool` config param, passed through the same `params` array
  `CacheSizeHandler::build()` already reads (alongside `host`/`cache_path`) — not
  auto-detected from the OS. Set it to `'du'` in `prod_configuration/rules/cache.php` and
  `'php_walk'` in `dev_configuration/rules/cache.php`.
- If the configured tool fails at runtime (binary missing, non-zero exit code), the request
  errors out the same way existing `BackendErrorException` failures do in this handler — no
  silent fallback to a different strategy.
- Update `loader.php` with new `require_once` lines for all new classes, in dependency order,
  before `CacheSizeHandler.php`.
- Follow the existing flat file-layout convention (no PSR-4 autoloading, no per-feature
  subfolder), with all new files under `lib/support/` or `lib/exceptions/` as listed above, named
  generically (`DirectorySize*`, not `CacheSize*`) since they are meant to be reused outside the
  cache handler.

**Testing:**

- `DuDirectorySizeStrategy`'s tests inject a fake `ShellExecutorInterface` to assert both the
  success path and the "binary missing / non-zero exit" error path deterministically, without
  running a real subprocess.
- `PhpWalkDirectorySizeStrategy`'s tests stay as they are today (real temp directory, no shell
  involved) — this is the current `CacheSizeHandlerTest` filesystem logic, just moved into its
  own, generic class.
- `CacheSizeHandler`'s own tests get a fake `DirectorySizeCalculator` injected, the same way it
  already fakes `HttpClientInterface` today — its tests should only cover
  staff-gating/response shaping, not delegate to real strategy computation.

## Acceptance criteria

- [ ] `DirectorySizeCalculator`, `DirectorySizeStrategyInterface`, `DuDirectorySizeStrategy`,
      `PhpWalkDirectorySizeStrategy`, `DirectorySizeStrategyRegistry`, `ShellExecutorInterface`,
      `NativeShellExecutor` exist under `proxy/extension/lib/support/`, and
      `ShellCommandFailedException` exists under `proxy/extension/lib/exceptions/`.
- [ ] `CacheSizeHandler` no longer walks the filesystem directly; it delegates to
      `DirectorySizeCalculator`.
- [ ] `DuDirectorySizeStrategy` shells out to `du -sb <path>` and returns an integer byte count.
- [ ] `PhpWalkDirectorySizeStrategy` preserves the previous `RecursiveIteratorIterator`-based
      behavior.
- [ ] A configured tool that fails at runtime (missing binary / non-zero exit) raises an error
      handled the same way as existing `BackendErrorException` failures, with no automatic
      fallback to another strategy.
- [ ] `cache_size_tool` config param is read from the handler's `params`, set to `'du'` in
      `prod_configuration/rules/cache.php` and `'php_walk'` in
      `dev_configuration/rules/cache.php`.
- [ ] `loader.php` requires all new files in dependency order before `CacheSizeHandler.php`.
- [ ] Tests cover: `DuDirectorySizeStrategy` success and failure paths via a fake
      `ShellExecutorInterface`; `PhpWalkDirectorySizeStrategy` via a real temp directory; and
      `CacheSizeHandler` staff-gating/response shaping via a fake `DirectorySizeCalculator`.
