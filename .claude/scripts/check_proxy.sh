#!/usr/bin/env bash
set -euo pipefail
set -x

# PHP is not installed on the host — it only ships inside the darthjee/tent
# image, so proxy rule files are linted through it.
docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c '
  find /repo/proxy -name "*.php" -not -path "*/vendor/*" -print0 |
  xargs -0 -n1 php -l
'

# Install PHPUnit via Composer if the vendor directory is not present.
# proxy/extension/ contains composer.json; the vendor dir is gitignored.
if [ ! -f "$PWD/proxy/extension/vendor/bin/phpunit" ]; then
  docker run --rm \
    -v "$PWD/proxy/extension":/app \
    -w /app \
    composer:latest \
    install --no-interaction
fi

# Run PHPUnit tests.
# Use --workdir so that vendor/bin/phpunit and tests/ both resolve relative to
# /var/www/html/extension (where proxy/extension/ is mounted).
docker-compose run --rm --workdir /var/www/html/extension proxy_tests vendor/bin/phpunit tests
