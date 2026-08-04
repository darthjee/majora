# Infra Plan: Add test for proxy extensions

Main plan: [plan.md](plan.md)

## Shared contracts

You own the `proxy_tests` service definition in `docker-compose.yml` that `proxy`'s
`check_proxy.sh` depends on:

- image: `darthjee/tent-test:0.10.0`
- volume: `./proxy/extension:/var/www/html/extension`
- default `command:` `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests`

Keep the service name (`proxy_tests`) and default command stable — `proxy` calls
`docker-compose run --rm proxy_tests` with no extra arguments and relies on this
default command running the full suite.

## Implementation Steps

### Step 1 — Fix the `proxy_tests` docker-compose service

In `docker-compose.yml`, the existing `proxy_tests` service currently points at
`darthjee/tent:0.10.0` (the lean production image, no PHPUnit) and runs
`vendor/bin/phpunit extension/tests` — this never actually worked. Replace it:

```yaml
proxy_tests:
  image: darthjee/tent-test:0.10.0
  volumes:
    - ./proxy/extension:/var/www/html/extension
  command: vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests
```

Verified locally — `docker-compose run --rm proxy_tests` (once this change is in
place) should print `OK (104 tests, 160 assertions)`.

### Step 2 — Add the `proxy_extension_tests` CircleCI job

In `.circleci/config.yml`, the `jobs:` section currently has no job that runs
`proxy/extension/tests` at all — `upload_extension` even `rm -rf`s that folder
before deploying. Add a new job, following the same `working_directory:
/home/app/app` + `checkout` pattern already used by `upload_proxy_files`/
`copy_proxy_configuration`/`upload_extension` (all of which also use a
`darthjee/tent*` image):

```yaml
proxy_extension_tests:
  docker:
    - image: darthjee/tent-test:0.10.0
  working_directory: /home/app/app
  steps:
    - checkout
    - run:
        name: Copy extension into place
        command: cp -r proxy/extension/. /var/www/html/extension/
    - run:
        name: Tests
        command: vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests
```

The CircleCI docker executor has no bind-mount equivalent, so the extension
folder is copied into place after checkout instead of mounted — verified locally
that this produces the identical result (`OK (104 tests, 160 assertions)`) via:

```bash
docker run --rm -v $PWD:/repo -w /home/app/app darthjee/tent-test:0.10.0 sh -c '
  cp -r /repo/proxy/extension/. /var/www/html/extension/ &&
  vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests
'
```

No `requires:` is needed on the job definition itself — `darthjee/tent-test` is a
fixed external tag, not one of this repo's own `release-image` build outputs
(same reasoning as the existing `upload_proxy_files`/`copy_proxy_configuration`
jobs, which use `darthjee/tent:0.10.0` the same way).

### Step 3 — Wire it into the `test` workflow

In `.circleci/config.yml`'s `workflows.test.jobs`, add `proxy_extension_tests` as
a peer of `pytest_views_characters`/`pytest_views_rest`/`pytest_all`/`jasmine`/
`checks`/`frontend-checks`:

```yaml
- proxy_extension_tests:
    filters: *all_tags
```

Then add `proxy_extension_tests` alongside that same group everywhere it appears
in a `requires:` list — do **not** add it to `coverage-final`'s `requires`
(explicitly out of scope: no coverage reporting for this job for now):

- `build-and-release`
- `upload_proxy_files`
- `upload_fe_files`
- `link_photos`
- `link_files`
- `upload_admin_assets`

(`upload_extension` and `copy_proxy_configuration` only need `[upload_proxy_files]`
in their own `requires:` — they already gate transitively through it, same as
today.)

## Files to Change

- `docker-compose.yml` — fix the `proxy_tests` service (Step 1).
- `.circleci/config.yml` — add the `proxy_extension_tests` job (Step 2) and wire
  it into `workflows.test.jobs` and the downstream `requires:` lists (Step 3).

## Notes

- The `darthjee/tent-test:0.10.0` tag was confirmed to exist and to match
  `:latest`'s digest at the time of writing.
- Local verification commands above were run on an arm64 host, which prints a
  harmless "requested image's platform ... does not match" warning under
  emulation — CircleCI's amd64 executors won't hit that.
