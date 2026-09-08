# Wire credentials and bot-protection headers

Extend `crawler/navi_config.yaml`'s `clients:` block:

- `majora_api.headers.Authorization: Token $MAJORA_API_TOKEN` — existing
  repo-wide convention (see `docs/agents/external/HOW_TO_USE_NAVI.md`'s
  sample configs and `navi/resources/*.yml`).
- `lootstudios.headers`:
  - Realistic browser-like headers to avoid the flat `403` bot-protection
    response observed against unheadered requests (per
    `docs/agents/specs/loot-crawling/emission-endpoint.md`'s "Request
    pacing/headers" note): `User-Agent`, `Accept`, `Accept-Language`. Use
    literal realistic values (not env-var-driven — these aren't secrets).
  - `Cookie: PHPSESSID=$LOOTSTUDIOS_SESSION_COOKIE`, sent defensively even
    though whether `GetMyLootsCache` needs auth at all is still unverified
    (#1282). If the referenced env var is unset, Navi substitutes an empty
    string and logs a warning (per
    `docs/agents/external/navi/reference.md`'s "Environment variables in
    client configuration") — harmless if the endpoint turns out not to need
    it.

Both env vars (`MAJORA_API_TOKEN`, `LOOTSTUDIOS_SESSION_COOKIE`) must never
be committed — confirm no `.env`/sample-value file is added alongside the
config, only the `$VAR` reference.

## Files to Change

- `crawler/navi_config.yaml` — add `headers:` to both `clients:` entries.
