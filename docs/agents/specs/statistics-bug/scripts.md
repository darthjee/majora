# Scripts

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

*Planned by #1702 (`emulate.py`) and #1703 (`analyse.py`).* Nothing on this page exists yet.
The general rules for investigation scripts live in the investigator agent docs (*planned by
#1698*); this page only covers what is specific to this bug.

## Layout

```text
investigations/statistics-bug/
├── README.md
├── emulate.py
├── analyse.py
├── docker-compose.yml   # standalone, not the project's
└── .gitignore           # reports
```

CI (lint, tests, coverage) must not pick up `investigations/`.

## `emulate.py` (#1702)

- Runs against the **local** stack only, through the proxy. It refuses a production base URL.
- Uses a browser-like cookie jar that applies `Set-Cookie` in **response arrival order**.
- Scenarios, mapped to [Hypotheses](hypotheses.md):
  - first visit;
  - sequential navigation;
  - page refresh burst (parallel requests), with and without a cookie, anonymous and logged in
    (hypothesis 2);
  - login mid-navigation (hypothesis 2b);
  - IP change through `X-Forwarded-For` (hypothesis 3);
  - host change (hypothesis 4);
  - a mix of standard-rule and custom-handler requests (hypothesis 1).
- Reports the sessions and visits each scenario created, read through the local export
  endpoint (see [Export endpoint](export-endpoint.md)).
- Parallel bursts run only against the local stack.
- **Local secrets:** the `X-Forwarded-For` scenario needs the local `PROXY_SECRET` (and the
  scripts may need the local skip secret). `emulate.py` reads them from the local `.env` or the
  environment, and never hardcodes, prints or logs them.

## `analyse.py` (#1703)

- **Authentication:** the device-authorization flow (see
  [Export endpoint](export-endpoint.md#device-authorization)): print the approval link, wait,
  poll. The token is kept in memory only. Denied, expired or revoked → clean stop, no partial
  report.
- **Fetching:** pages **sequentially** (never in parallel) against production, starting with a
  narrow date range.
- **Grouping:**
  - same `user_id` → high confidence;
  - same domain + same or nearby IP + close timestamps → low confidence (NAT caveat: unrelated
    visitors may share an IP).
- **Classification:** parallel race, login rotation, IP flip, domain change, single-hit orphan,
  legitimate (see [Symptom](symptom.md#legitimate-new-sessions)), other.
- **Report:** text and JSON, git-ignored (see [Privacy](privacy.md)).

## Cross-validation

`analyse.py` is first run on local data produced by `emulate.py`. It must find exactly the
duplicates each scenario produced before it is trusted on production.

## Self-pollution

The scripts' own requests must not create statistics sessions or visits. This is verified,
not assumed.
