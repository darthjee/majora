# Plan: Add test for proxy extensions

Issue: [970-add-test-for-proxy-extensions.md](../../issues/970-add-test-for-proxy-extensions.md)

## Overview

Wire the already-complete `proxy/extension/tests/` PHPUnit suite into CI and local
tooling using the `darthjee/tent-test:0.10.0` image, which bundles PHPUnit (unlike
the lean `darthjee/tent` image the current, broken local setup points at). No new
tests are written — every class with real logic already has coverage; this is
purely about actually running the existing suite, which today runs nowhere.

Verified locally end-to-end (both approaches give `OK (104 tests, 160 assertions)`):

```bash
# docker-compose / local dev shape
docker run --rm -v ./proxy/extension:/var/www/html/extension darthjee/tent-test:0.10.0 \
  vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests

# CircleCI shape (no bind-mount support on the docker executor — copy instead)
docker run --rm -v $PWD:/repo -w /home/app/app darthjee/tent-test:0.10.0 sh -c '
  cp -r /repo/proxy/extension/. /var/www/html/extension/ &&
  vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests
'
```

Note: `/var/www/html` is a symlink baked into the Tent image; `proxy/extension/loader.php`
itself requires its sibling `lib/*.php` files via `__DIR__`-relative paths, so the
extension folder must land at exactly `/var/www/html/extension` (mount or copy) —
that's why the recipe above isn't simplified further.

## Agents involved

- [infra](infra.md)
- [proxy](proxy.md)

## Shared contracts

`infra` owns and defines the `proxy_tests` service in `docker-compose.yml`:

- image: `darthjee/tent-test:0.10.0`
- volume: `./proxy/extension:/var/www/html/extension`
- default `command:` `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests`

`proxy` consumes this service as-is, with no extra arguments — its rewritten
`.claude/scripts/check_proxy.sh` calls exactly `docker-compose run --rm proxy_tests`
and relies on the service's own default command to run the full suite. If `infra`
changes the service name or its default command, `proxy`'s script call must be
updated to match.
