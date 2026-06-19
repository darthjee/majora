#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose run --rm majora_fe yarn test
docker-compose run --rm majora_fe yarn lint_fix
