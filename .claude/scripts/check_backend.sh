#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose run --rm majora_tests poetry run pytest
docker-compose run --rm majora_tests poetry run ruff check --fix .
