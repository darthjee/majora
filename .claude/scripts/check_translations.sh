#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose run --rm majora_fe yarn check_i18n
