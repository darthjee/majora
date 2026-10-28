# Environments

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

A cause may only exist in production. These are the known differences between the local stack
and production that can change how statistics sessions are created.

## Local vs. production

| Aspect | Local | Production | Relevant hypotheses |
|---|---|---|---|
| Proxy configuration | `proxy/dev_configuration` | `proxy/prod_configuration` | 1, 5 |
| HTTPS / `SESSION_COOKIE_SECURE` | plain HTTP | HTTPS | 6 |
| Client-IP resolution | `PROXY_SECRET` from `.env` | `PROXY_SECRET` on Render and in Tent's `locals.php` | 1, 3 |
| Edge proxy / CDN in front of Tent | none | not verified (see [Client IP integrity](../../statistics.md#client-ip-integrity)) | 3 |
| MySQL datetime precision | to check | to check | 2 |

MySQL datetime precision must be checked before relying on "created milliseconds apart" in the
analysis: without fractional seconds, a parallel burst looks like simultaneous creation.

## Confirming a production-only cause

When a cause cannot be reproduced locally (for example an edge proxy that only exists in
production), it is confirmed from `analyse.py` evidence alone, and [Findings](findings.md)
says so explicitly.
