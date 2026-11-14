# No-host-ports guard in check_infra.sh

Keep the "tests never publish host ports" rule (#1724, #1775) from quietly breaking later.

Add a step to `.claude/scripts/check_infra.sh`, right after `docker-compose config -q` and before the backend/frontend checks. The step renders **only the base file** and fails if any service defines `ports`:

```bash
docker-compose -f docker-compose.yml config --format json | python3 -c '
import json, sys
services = json.load(sys.stdin).get("services", {})
bad = sorted(name for name, svc in services.items() if svc.get("ports"))
if bad:
    sys.exit("Base docker-compose.yml must not publish host ports (use docker-compose.ports.yml): " + ", ".join(bad))
'
```

- Pass `-f docker-compose.yml` explicitly, so a future `docker-compose.override.yml` or `COMPOSE_FILE` can't hide mappings or add them.
- Keep `set -euo pipefail`, so a failing guard fails the script.
- Test the guard once: temporarily add a `ports:` entry to a service, confirm the script fails and names that service, then revert.

## Files to Change
- `.claude/scripts/check_infra.sh`: new no-host-ports guard on the base compose file.
