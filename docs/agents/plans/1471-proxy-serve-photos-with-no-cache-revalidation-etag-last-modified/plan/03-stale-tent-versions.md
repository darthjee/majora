# Refresh stale Tent version references
Agent docs and the helper script still reference `darthjee/tent:0.7.8` and
`darthjee/tent-test:0.10.0`. Update them to `1.0.2` to match `docker-compose.yml` and CircleCI.

## Files to Change
- `.claude/agents/proxy.md` — `tent:0.7.8` (lines ~28, 31, 105) and `tent-test:0.10.0` (line ~93) → `1.0.2`.
- `.claude/agents/infra.md` — `majora_proxy` image `darthjee/tent:0.7.8` → `1.0.2`.
- `.claude/scripts/check_proxy.sh` — `tent:0.7.8` → `1.0.2`.
