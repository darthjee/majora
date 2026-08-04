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
