# Infra Plan: Include proxy tests in CircleCI

Main plan: [plan.md](plan.md)

## Shared contracts

- **Coverage file format**: Clover XML (`--coverage-clover`)
- **Coverage file path** (inside CI container): `/tmp/coverage.xml`
- **Codacy upload command**: `bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -l PHP -r /tmp/coverage.xml`

## Implementation Steps

### Step 1 — Add the `proxy-tests` job to `.circleci/config.yml`

Add a new job named `proxy-tests` under the `jobs:` section. It should:

1. Use the `darthjee/tent:0.8.0` Docker image (same image used for `upload_proxy_files` and `link_photos`).
2. Set `working_directory: /home/app/app` (same convention as other tent-based jobs).
3. Check out the repo (`- checkout`).
4. Copy `proxy/extension/` into the tent framework's extension directory:
   ```
   cp -r proxy/extension /var/www/html/extension
   ```
5. Run `composer install --no-interaction` inside `/var/www/html/extension/`:
   ```
   cd /var/www/html/extension && composer install --no-interaction
   ```
6. Run PHPUnit with Clover coverage output. Run from `/var/www/html/extension/` so that `phpunit.xml` is auto-detected and source paths resolve correctly:
   ```
   cd /var/www/html/extension && vendor/bin/phpunit --coverage-clover /tmp/coverage.xml
   ```
   If the tent image requires an explicit Xdebug mode, prepend `XDEBUG_MODE=coverage`.
7. Upload partial coverage to Codacy:
   ```
   bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -l PHP -r /tmp/coverage.xml
   ```

### Step 2 — Wire `proxy-tests` into the `test` workflow

In the `workflows.test.jobs` list:

1. Add `proxy-tests` as a job entry with `filters: *all_tags`. It has no `requires:` dependencies (it does not depend on image builds — the `darthjee/tent:0.8.0` image is pre-built).
2. Add `proxy-tests` to the `requires:` list of `coverage-final` (alongside the existing `pytest` and `jasmine`).

The updated `coverage-final` entry:
```yaml
- coverage-final:
    requires: [pytest, jasmine, proxy-tests]
    filters: *all_tags
```

## Files to Change

- `.circleci/config.yml` — add `proxy-tests` job definition and wire it into the `test` workflow

## CI Checks

- `.circleci/`: CircleCI validates config automatically on push (CI job: `proxy-tests`)

## Notes

- The `darthjee/tent:0.8.0` image already has PHP and Composer. No new Docker image is needed.
- Coverage requires Xdebug or PCOV in the tent image. If `--coverage-clover` fails with a "No code coverage driver is available" error, add `XDEBUG_MODE=coverage` as an environment variable on the job or prefix it on the phpunit command.
- `build-and-release` and `upload_proxy_files` currently only require `[pytest, jasmine, frontend-checks, checks]`. Do NOT add `proxy-tests` to those requires lists — the issue asks only for `coverage-final` to depend on it.
