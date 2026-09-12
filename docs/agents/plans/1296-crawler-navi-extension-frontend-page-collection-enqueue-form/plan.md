# Plan: Crawler: Navi extension frontend page - collection Enqueue form

Issue: [1296-crawler-navi-extension-frontend-page-collection-enqueue-form.md](../../issues/1296-crawler-navi-extension-frontend-page-collection-enqueue-form.md)

## Overview

Add the frontend half of the Lootstudios crawler's interactive Enqueue
feature: a `crawler/navi-extension` page with a URL input and an "Enqueue"
button that POSTs to #1295's already-implemented
`POST /ext/lootstudios/enqueue.json` route and renders its response
(confirmation on `200`, error message on `400`/`404`/`502`).

See [crawler.md](crawler.md) for the full plan.
