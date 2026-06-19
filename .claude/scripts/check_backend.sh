#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose run --rm majora_tests pytest
docker-compose run --rm majora_tests ruff check --fix .
