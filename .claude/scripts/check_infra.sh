#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose config -q

# Guard (#1724, #1775): the base docker-compose.yml must never publish host
# ports, so tests can run in parallel with other projects on the same host.
# Host mappings belong in the opt-in docker-compose.ports.yml. `-f` is explicit
# so a docker-compose.override.yml or COMPOSE_FILE can't hide or add mappings.
docker-compose -f docker-compose.yml config --format json | python3 -c '
import json, sys
services = json.load(sys.stdin).get("services", {})
bad = sorted(name for name, svc in services.items() if svc.get("ports"))
if bad:
    sys.exit("Base docker-compose.yml must not publish host ports (use docker-compose.ports.yml): " + ", ".join(bad))
'
python3 -c "import yaml; yaml.safe_load(open('.circleci/config.yml'))"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -x "$SCRIPT_DIR/check_backend.sh" ]; then
  "$SCRIPT_DIR/check_backend.sh"
fi

if [ -x "$SCRIPT_DIR/check_frontend.sh" ]; then
  "$SCRIPT_DIR/check_frontend.sh"
fi
