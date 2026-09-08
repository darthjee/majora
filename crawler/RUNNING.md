# Running the Lootstudios Crawler

A permanent operational runbook for the Lootstudios crawler: a maintainer-run,
on-demand tool, not something CI runs. Lootstudios' catalog endpoint
(`GetMyLootsCache`, see
[`docs/agents/specs/loot-crawling/collection-to-stl-models.md`](../docs/agents/specs/loot-crawling/collection-to-stl-models.md)
and
[`docs/agents/specs/loot-crawling/source-to-collections.md`](../docs/agents/specs/loot-crawling/source-to-collections.md))
is gated behind the requesting user's own logged-in Lootstudios session, tied
to whichever account owns the purchased library — not a service credential —
so it can't be run unattended in CI.

This doc assumes the two prerequisite sub-issues of the Lootstudios crawler
chain (parent [#1260](https://github.com/darthjee/majora/issues/1260)) have
landed:

- [#1262](https://github.com/darthjee/majora/issues/1262) — the backend
  crawler-import endpoint (`Source`/`Collection`/`StlModel` upsert).
- [#1263](https://github.com/darthjee/majora/issues/1263) — the Navi
  configuration that extracts Lootstudios' catalog and emits it to that
  endpoint.

**As of this writing, both #1262 and #1263 are still open.** Sections below
that depend on their exact implementation are marked `TBD` — update them once
those issues resolve, following what was actually built rather than what they
originally proposed.

## Prerequisites

- **Node.js**, to run [Navi](../docs/agents/external/HOW_TO_USE_NAVI.md), the
  crawling engine (a resource's `parser:`/`emit:` blocks extract items from a
  response and POST each one onward — see
  [Extraction Configuration](../docs/agents/external/navi/extraction-configuration.md)
  and [Emit Configuration](../docs/agents/external/navi/emit-configuration.md)).
  Since this is a local, on-demand run rather than a CI step, use
  [Option B — Node.js image with `navi-hey` installed](../docs/agents/external/navi/option-b-nodejs-image.md):
  either run it without installing anything (`npx navi-hey --config <path>`),
  or install it once (`npm install -g navi-hey` / `yarn global add navi-hey`)
  and invoke `navi-hey --config <path>` directly.
- **A valid Majora API token.** The crawler authenticates as an automated
  client via `Authorization: Token <key>`
  (`backend/accounts/authentication.py`'s `CookieTokenAuthentication`, the
  DRF-wide default), not a browser session cookie — see
  [`docs/guides/majora.md#authentication`](../docs/guides/majora.md#authentication).
  Tokens are standard DRF authtoken rows; obtain/rotate one for your account
  via the Django admin (`/admin/`) — no dedicated tooling exists for this yet.
  The account backing the token must be staff/admin (`is_staff` or
  `is_superuser`), since every miniatures write endpoint (and the crawler
  import endpoint from #1262) is staff/admin-only.
- **The Navi config file** added by #1263 — `crawler/navi_config.yaml`.

## Obtaining/refreshing the Lootstudios session

The Navi config expects a Lootstudios session credential tied to the account
that owns the purchased library — this is inherently a personal credential,
never committed to the repo, supplied at run time via an environment variable
(per the `$VAR`/`${VAR}` substitution convention documented in
[Navi's Reference page](../docs/agents/external/navi/reference.md)).

Based on the exploration in
[`docs/agents/specs/loot-crawling/collection-to-stl-models.md`](../docs/agents/specs/loot-crawling/collection-to-stl-models.md)
(Approach B, `Load_ObjectExplorer`), the credential Lootstudios itself relies
on is a `PHPSESSID` cookie value obtained by logging into
`https://app.lootstudios.com` in a regular browser and copying the
`PHPSESSID` cookie (browser devtools → Application/Storage → Cookies).
**However, whether it's actually required is still unverified**: the primary
extraction approach (`GetMyLootsCache`, used by #1263) was observed
responding without an explicit auth header/cookie in the exploration pass —
whether it actually needs a session at all is an open question left
unresolved in that spec page (`Open question 1`, tracked further by #1282).
`crawler/navi_config.yaml` sends the cookie defensively regardless — harmless
if it turns out not to be needed (an unset env var just substitutes an empty
`Cookie` value, per Navi's environment-variable-substitution behavior):

- **Environment variable name**: `LOOTSTUDIOS_SESSION_COOKIE` — substituted
  into the `lootstudios` client's `Cookie: PHPSESSID=$LOOTSTUDIOS_SESSION_COOKIE`
  header in `crawler/navi_config.yaml`.
- **How to obtain it**: log into `https://app.lootstudios.com` with the
  account that owns the target library, then copy the `PHPSESSID` cookie
  value from the browser (devtools → Application/Storage → Cookies).
- **Expiry / refreshing**: Lootstudios' session cookies expire like any
  standard PHP session. If a run starts failing with an authentication-style
  error (see "Running it" below for how that surfaces), log into
  `https://app.lootstudios.com` again and replace the environment variable
  with the freshly issued cookie value before re-running.

## Running it

Export the required environment variables, then invoke `navi-hey` against
`crawler/navi_config.yaml` — either via `npx` (no install needed) or a
globally-installed `navi-hey`:

```bash
export MAJORA_API_TOKEN=<your Majora API token>
export MAJORA_API_BASE_URL=<Majora backend base URL, e.g. http://localhost:3030>
export LOOTSTUDIOS_SESSION_COOKIE=<your PHPSESSID cookie value>

npx navi-hey --config crawler/navi_config.yaml
# or, if navi-hey is installed globally:
navi-hey --config crawler/navi_config.yaml
```

`crawler/navi_config.yaml` declares no `web:` section, so it runs headlessly
(per
[Reference — Headless vs. web UI mode](../docs/agents/external/navi/reference.md#headless-vs-web-ui-mode)):
there is no dashboard to open, and all output — job progress, retries, and
failures — surfaces via the `navi-hey` process's own stdout/stderr. Navi
exits automatically once every job (the initial `GetMyLootsCache` fetch, plus
one emit per extracted bundle/miniature) has been processed.

A failed emit (e.g. a `401`/`403` from a Majora import endpoint due to a bad
or missing `MAJORA_API_TOKEN`, or a non-`200` from Lootstudios if
`LOOTSTUDIOS_SESSION_COOKIE` has expired and turns out to be required after
all — see #1282) shows up as a retried, then eventually dead-lettered job in
the log output, distinguishable from a normal run by repeated retry-cooldown
log lines followed by a "moved to dead queue" message for that job, instead
of the run exiting cleanly once the queue drains.

## Verifying it worked

Regardless of the exact invocation, success can be confirmed directly against
Majora's existing miniatures API
([`docs/guides/majora/miniatures.md`](../docs/guides/majora/miniatures.md)):

1. **A "Lootstudios" `Source` exists.**
   `GET /miniatures/sources.json?name=Lootstudios` (any authenticated user)
   should return exactly one source once the crawler has run at least once.
   Note its `id`.
2. **`StlModel`s were created/updated under that source.**
   `GET /miniatures/stl_models.json?source=<id>` should list the imported
   miniatures. Cross-check the count/names against what
   `GetMyLootsCache` reports for the account (see
   [`docs/agents/specs/loot-crawling/collection-to-stl-models.md`](../docs/agents/specs/loot-crawling/collection-to-stl-models.md)
   for the field mapping: Lootstudios' `obj_title` → `name`, `obj_inid` →
   `external_id`).
3. **Each imported model links back to its Lootstudios page.**
   `GET /miniatures/stl_models/<id>.json` on one of the new/updated models —
   its `links` array should include an entry with `link_type: "lootstudio"`
   pointing at the model's `url` on `app.lootstudios.com` (per #1262's
   contract).
4. **Bundles became `Collection`s.**
   `GET /miniatures/collections.json?name=<bundle name>` should return the
   bundle as a `Collection` scoped under the Lootstudios `Source`, and the
   `StlModel` detail response above should list it under `collections`.
5. **A re-run is an update, not a duplicate or an error.** Run the crawler a
   second time over the same catalog. Per #1262's upsert semantics
   (match by `external_id` first, `url` fallback), the same `StlModel`/
   `Collection`/`Source` rows should be reused — `GET
   /miniatures/stl_models.json?source=<id>` should report the same count as
   before (not doubled), and each item's `id` should be unchanged from the
   first run. A re-run that instead errors (e.g. a `400` on a duplicate
   `url`) indicates the crawler-import endpoint's upsert logic isn't behaving
   as #1262 specifies — treat that as a bug in #1262's implementation, not
   expected behavior.

If any of the above doesn't hold, re-check the Navi config's `emit:`
`body_template` (#1263) against the exact fields #1262's endpoint expects
before assuming the crawler itself is broken.
