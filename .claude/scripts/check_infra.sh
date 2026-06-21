#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose config -q
docker-compose run --rm majora_tests python -c "import yaml; yaml.safe_load(open('.circleci/config.yml'))"

# PHP is not installed on the host — it only ships inside the darthjee/tent
# image, so proxy rule files are linted through it.
docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c '
  find /repo/docker_volumes/proxy_configuration /repo/prod_proxy_config -name "*.php" -print0 |
  xargs -0 -n1 php -l
'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -x "$SCRIPT_DIR/check_backend.sh" ]; then
  "$SCRIPT_DIR/check_backend.sh"
fi

if [ -x "$SCRIPT_DIR/check_frontend.sh" ]; then
  "$SCRIPT_DIR/check_frontend.sh"
fi
