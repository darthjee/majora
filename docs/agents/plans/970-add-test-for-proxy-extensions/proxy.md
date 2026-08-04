# Proxy Plan: Add test for proxy extensions

Main plan: [plan.md](plan.md)

## Shared contracts

`infra` owns and defines the `proxy_tests` service in `docker-compose.yml`:

- image: `darthjee/tent-test:0.10.0`
- volume: `./proxy/extension:/var/www/html/extension`
- default `command:` `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests`

Your rewritten `check_proxy.sh` must call it as `docker-compose run --rm proxy_tests`
with no extra arguments, relying on that default command to run the full suite.
Do not pass your own `vendor/bin/phpunit ...` override — that duplicates a
contract `infra` already owns.

## Implementation Steps

### Step 1 — Simplify `.claude/scripts/check_proxy.sh`

The script currently does a manual `composer install` into the gitignored
`proxy/extension/vendor/` (to get PHPUnit) before running tests through the
(currently broken) `proxy_tests` service. `darthjee/tent-test` bundles PHPUnit
itself, so that workaround is no longer needed. Keep the existing `php -l` lint
block untouched (explicitly out of scope — separate concern, keeps its own
`darthjee/tent:0.7.8` pin), and replace the composer-install + phpunit block:

```bash
#!/usr/bin/env bash
set -euo pipefail
set -x

# PHP is not installed on the host — it only ships inside the darthjee/tent
# image, so proxy rule files are linted through it.
docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c '
  find /repo/proxy -name "*.php" -not -path "*/vendor/*" -print0 |
  xargs -0 -n1 php -l
'

# Run PHPUnit tests (darthjee/tent-test bundles PHPUnit — no local composer
# install needed).
docker-compose run --rm proxy_tests
```

### Step 2 — Fix `proxy/extension/composer.json`/`composer.lock` and the vendor gitignore entry

`proxy/extension/composer.json` exists solely to install PHPUnit locally
(`require-dev: phpunit/phpunit`) for the old broken flow — no longer needed once
`check_proxy.sh` goes through `darthjee/tent-test`. Delete
`proxy/extension/composer.json` and `proxy/extension/composer.lock`, and remove
the now-unused entry (and its comment) from the root `.gitignore`:

```
# Composer vendor directory for proxy extension (installed locally before running tests)
proxy/extension/vendor/
```

Confirm nothing else references `proxy/extension/vendor/` or
`proxy/extension/composer.json` before deleting (a quick repo-wide grep) — it
was confirmed gitignored and untracked as of this plan.

### Step 3 — Fix `.claude/agents/proxy.md`

This file (your own instructions) is out of date — it still describes a
`proxy/custom/` layout that no longer exists; the real layout is
`proxy/extension/`. Fix, in order of appearance:

1. **"Your scope"** — replace:
   ```
   - `proxy/custom/extend/` — custom PHP middleware classes
   - `proxy/custom/tests/` — PHPUnit tests for custom middleware
   ```
   with:
   ```
   - `proxy/extension/lib/` — custom PHP middleware/handler/support classes
   - `proxy/extension/tests/` — PHPUnit tests for the extension
   ```

2. **"PHP is not installed on the host" block** — the `docker-compose run
   proxy_tests` example is already correct in form (matches Step 1 above
   unchanged); no edit needed there beyond what naturally falls out of fixing
   the surrounding sections.

3. **"Tent proxy overview"** — `extending.md` does not exist; the real filename
   is `extending-tent.md`. Fix the list to reference
   `docs/agents/external/tent/extending-tent.md` (the hub link,
   `HOW_TO_USE_DARTHJEE-TENT.md`, is already correct).

4. **"Custom middleware" section** — replace the whole section (paths, namespace
   description, and the stale `proxy_tests`/`darthjee/tent:0.7.8`/`./proxy/custom`
   description) to match the current reality:
   - Classes live in `proxy/extension/lib/` (organized under `middlewares/`,
     `handlers/`, `support/`, `exceptions/`), using the `Tent\Middlewares`/
     `Tent\RequestHandlers` namespaces per `proxy/extension/loader.php`.
   - Tests live in `proxy/extension/tests/`, mirroring that structure.
   - The `proxy_tests` docker-compose service (image `darthjee/tent-test:0.10.0`)
     mounts `./proxy/extension` and runs the suite via an explicit
     `--bootstrap`-qualified PHPUnit invocation (see the shared contract above)
     — not a bare `custom/tests` path.

5. **"Local development checks" block** — same fix as Step 1: keep the lint
   block as-is, the PHPUnit line is already `docker-compose run proxy_tests`
   and needs no change in form (only the surrounding prose/paths from points
   1 and 4 above).

## Files to Change

- `.claude/scripts/check_proxy.sh` — drop the composer-install workaround
  (Step 1).
- `proxy/extension/composer.json`, `proxy/extension/composer.lock` — delete
  (Step 2).
- `.gitignore` — remove the `proxy/extension/vendor/` entry and its comment
  (Step 2).
- `.claude/agents/proxy.md` — fix stale `proxy/custom/*` paths, the
  `extending.md` filename, and the "Custom middleware" section's description
  of the test setup (Step 3).

## Notes

- Do not touch the `php -l` lint step or its `darthjee/tent:0.7.8` pin — out of
  scope per the issue discussion (kept as a separate concern).
- This plan depends on `infra`'s `proxy_tests` service update (see the shared
  contract) — if that lands with a different service name or default command,
  `check_proxy.sh` (Step 1) needs to match.
