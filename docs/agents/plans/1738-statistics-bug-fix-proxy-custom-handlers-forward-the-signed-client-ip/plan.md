# Plan: Statistics bug fix: proxy custom handlers forward the signed client IP

Issue: [1738-statistics-bug-fix-proxy-custom-handlers-forward-the-signed-client-ip.md](../../issues/1738-statistics-bug-fix-proxy-custom-handlers-forward-the-signed-client-ip.md)

## Overview

Make every backend call made by a Tent custom handler (through `BackendClient`) carry the
signed client IP — `X-Forwarded-For` from `REMOTE_ADDR` plus `X-Proxy-Secret` — reusing
`SetClientIpMiddleware`'s logic through a shared helper, with the secret wired in as a
`secret` handler attribute.

See [proxy.md](proxy.md) for the full plan.
