# Plan: Frontend — /#/staff/crawler two-column debug page

Issue: [1274-frontend------staff-crawler-two-column-debug-page.md](../issues/1274-frontend------staff-crawler-two-column-debug-page.md)

## Overview

Add a staff/superuser-only `/#/staff/crawler` page that renders a two-column
debug view over the already-merged `/staff/crawler.json` endpoint: a
`tail -f`-style, auto-scrolling feed of `CrawlerDebugEmission` records on the
left (drain-then-poll cursor loop, polling every 10s once caught up), and the
selected record's pretty-printed JSON on the right.

See [frontend.md](frontend.md) for the full plan.
