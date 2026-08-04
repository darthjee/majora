# Issue: Add test for proxy extensions

## Description
Tent (our proxy) now ships a `darthjee/tent-test` image built specifically for
running PHPUnit tests against custom extensions (matchers, middlewares,
handlers) — see `docs/agents/external/tent/extending-tent.md`. We should make
use of it to actually run our proxy extension tests as part of CI.

## Problem
`proxy/extension/tests/` already has a fairly complete PHPUnit suite
(handlers, middlewares, support classes) covering every class with real
logic. Files with no test (two exception classes, the `cache_cleanup/*.php`
config-data arrays) carry no behavior worth testing — this is not about
writing new tests, it's about actually running the existing suite, which
today runs nowhere:

- CircleCI has no job for it at all; `upload_extension` even deletes
  `proxy/extension/tests/` before deploying.
- The local `proxy_tests` service in `docker-compose.yml` points at
  `darthjee/tent:0.10.0`, the lean production image, which ships no PHPUnit —
  so it never actually worked.
- `.claude/scripts/check_proxy.sh` works around that by manually
  `composer install`-ing PHPUnit into the gitignored `proxy/extension/vendor/`
  before invoking the (broken) `proxy_tests` service.

## Solution
Switch everything over to `darthjee/tent-test:0.10.0`, which bundles PHPUnit
itself. Verified locally end-to-end: a single mount of `proxy/extension/` at
`/var/www/html/extension/` plus an explicit PHPUnit invocation runs the
existing suite unmodified, 104/104 green:

```bash
docker run --rm -v ./proxy/extension:/var/www/html/extension darthjee/tent-test:0.10.0 \
  vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests
```

(The two-mount layout suggested by `extending-tent.md` — a second mount for a
separate test folder at `/var/www/html/tests/extension/` — breaks 25 of the
existing tests: `CacheCleanupMapTest.php` uses a relative
`__DIR__ . '/../../lib/...'` require that assumes `tests/` stays nested
directly under `extension/`. The single-mount recipe above avoids that
without touching any test file.)

Concretely:

1. **`docker-compose.yml`** — update the `proxy_tests` service to use
   `darthjee/tent-test:0.10.0` with the mount/command above (replacing the
   current broken `darthjee/tent:0.10.0` + `vendor/bin/phpunit extension/tests`
   setup).
2. **`.claude/scripts/check_proxy.sh`** — drop the manual `composer install`
   workaround (no longer needed — `tent-test` bundles PHPUnit) and just run
   `docker-compose run --rm proxy_tests`. Its separate `php -l` lint step
   (pinned to `darthjee/tent:0.7.8`) is out of scope here and stays as-is —
   this issue is about wiring the test suite, not the lint step.
3. **`.circleci/config.yml`** — add a new job (e.g. `proxy_extension_tests`)
   using `darthjee/tent-test:0.10.0` to run the same suite, as a peer to the
   existing `pytest_views_characters`/`pytest_views_rest`/`pytest_all`/
   `jasmine`/`checks`/`frontend-checks` jobs: same `filters: *all_tags`, and
   added alongside them to every `requires:` list currently gated by that
   group — `build-and-release`, `upload_proxy_files`, `upload_fe_files`,
   `link_photos`, `link_files`, `upload_admin_assets`. **Not** added to
   `coverage-final`'s `requires` — no coverage reporting for this job for now
   (can revisit later).
4. Once `proxy/extension`'s own `composer.json`/`composer.lock` (which exist
   solely to install PHPUnit locally) are no longer needed by anything, remove
   them along with the `proxy/extension/vendor/` gitignore entry.
5. **`.claude/agents/proxy.md`** — fix it while in this area: it still
   references `proxy/custom/extend/`/`proxy/custom/tests/` (the current
   layout is `proxy/extension/`), the outdated `darthjee/tent:0.7.8` image
   tag, and wrong doc filenames (`extending.md`/
   `HOW_TO_USE_DARTHJEE-TENT.md` instead of the actual
   `docs/agents/external/tent/extending-tent.md`). Update it to match the
   current layout and the new `docker-compose run proxy_tests` command from
   point 1 above.

Version pinned to `0.10.0` to match the existing `darthjee/tent:0.10.0` used
elsewhere in CI (confirmed `darthjee/tent-test:0.10.0` exists and matches
`latest`'s digest at time of writing).

## Benefits
Proxy extension regressions (cache cleanup rules, upload/delete handlers,
client-IP/header middlewares) get caught by CI before deploy, instead of
relying on a local check script that was silently broken.
