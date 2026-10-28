# Privacy

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

The general rules for handling production data during investigations live in the investigator
agent docs (*planned by #1698*). They are not restated here; this page covers what is specific
to this bug.

## Public repository

`darthjee/majora` is public: the specs, the findings and the issues are readable by anyone.
Nothing committed or posted contains:

- real IPs, user ids or session ids;
- real token values (only `mjr_...` placeholders);
- the value of the `X-Statistics-Skip-Secret` header (it may be named, never shown);
- anything from `.env` or the Render environment.

Examples use documentation-only values: IPs from the RFC 5737 ranges (`192.0.2.0/24`,
`198.51.100.0/24`, `203.0.113.0/24`) and made-up ids.

## Token handling

- The `statistics:read` token used by `analyse.py` is kept in memory only, never written to
  disk or logs.
- It is revoked at the end of the investigation.

## Reports

- `analyse.py` reports (text and JSON) are git-ignored.
- Anything copied from a report into the repository or an issue (including
  [Findings](findings.md)) is aggregated or anonymised, for example masked IPs such as
  `203.0.113.x`.

## Exploitable findings

If the investigation confirms something exploitable (for example cookie or session leakage
through the cache, [hypothesis 5](hypotheses.md#5-proxycache-replaying-set-cookie)), #1704
reports it **privately** to the repository owner before any public write-up. The specs and
findings carry only what the owner approves.
