#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose config -q
docker-compose run --rm majora_tests python -c "import yaml; yaml.safe_load(open('.circleci/config.yml'))"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -x "$SCRIPT_DIR/check_backend.sh" ]; then
  "$SCRIPT_DIR/check_backend.sh"
fi

if [ -x "$SCRIPT_DIR/check_frontend.sh" ]; then
  "$SCRIPT_DIR/check_frontend.sh"
fi
