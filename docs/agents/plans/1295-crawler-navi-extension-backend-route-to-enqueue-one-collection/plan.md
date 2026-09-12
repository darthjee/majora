# Plan: Crawler: Navi extension backend route to enqueue one collection

Issue: [1295-crawler-navi-extension-backend-route-to-enqueue-one-collection.md](../../issues/1295-crawler-navi-extension-backend-route-to-enqueue-one-collection.md)

## Overview

Add `crawler/navi-extension/src/backend/enqueue.js`, the `RequestHandler` that
implements `POST /ext/lootstudios/enqueue.json` per #1292's landed spec:
validate the Lootstudios bundle URL, resolve the slug/`obj_inid` with one
direct `GetMyLootsCache` call, synthesize and push a per-collection two-pass
Navi resource under a fresh namespace, and start it via `navi-hey-client`'s
`NaviClient`.

See [crawler.md](crawler.md) for the full plan.
