# Fill in RUNNING.md's TBD placeholders

`crawler/RUNNING.md` (written by #1264, already merged) has several
sections explicitly marked `TBD — see #1263`. Update each now that the
config exists:

- **Prerequisites** — replace "`TBD` — see #1263 for its final path" with
  the actual path, `crawler/navi_config.yaml`.
- **Obtaining/refreshing the Lootstudios session** — replace the `TBD` env
  var name with `LOOTSTUDIOS_SESSION_COOKIE` (from Step 02), and firm up the
  "provisional"/"TBD" language now that the config concretely sends it as a
  `PHPSESSID` cookie — but keep the framing that whether it's actually
  *required* is still unverified pending #1282; don't overstate confidence
  the config itself doesn't have.
- **Running it** — replace the whole `TBD` section with the literal
  invocation: `MAJORA_API_TOKEN=... LOOTSTUDIOS_SESSION_COOKIE=... npx
  navi-hey --config crawler/navi_config.yaml` (or the globally-installed
  `navi-hey --config crawler/navi_config.yaml` form), state that the config
  runs headless (no `web:` key — confirm this matches what Step 01 actually
  wrote) so output surfaces via stdout/stderr, and describe what a failed
  emit looks like there (per Navi's dead-letter/failed-job logging).
- Leave "Verifying it worked" as-is — it already describes verification
  purely in terms of the existing miniatures API, not the config's
  internals, so nothing there depends on config specifics beyond what's
  already correct.

## Files to Change

- `crawler/RUNNING.md` — replace the `TBD` sections listed above with
  concrete values matching what Steps 01/02 actually wrote.
