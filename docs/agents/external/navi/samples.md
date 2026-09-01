# Navi Samples

Samples are end-to-end, copy-paste recipes: each one combines several Navi
features into a complete, runnable configuration for a concrete goal, with a run
line and a concrete walk-through of what the engine does. They complement — not
replace — the per-feature reference pages in
[How to Use Navi](../HOW_TO_USE_NAVI.md), which document every field and option
in isolation. Each recipe file below is self-contained; its optional *Notes*
section links to the matching feature guide for the full field reference.

## Cache warm-up

- [Basic headless cache warm-up](samples/basic-warmup.md) — minimal headless config for a CI warm run.
- [Warm HTML pages and their CSS/JS assets](samples/html-and-assets.md) — warm HTML pages plus the CSS/JS they reference.
- [Chain from an index to detail pages with `actions`](samples/resource-chaining.md) — fan out from an index response into per-item detail requests.
- [Warm a paginated API](samples/paginated-warmup.md) — one request per page, with a `max_page` cap.
- [Split a large config across files and namespaces](samples/split-config.md) — organise a large config across files and namespaces.
- [CI warm-up with a failure threshold](samples/ci-failure-threshold.md) — fail the pipeline when too many jobs stay dead.

## Crawling

- [Emit every extracted item to an external endpoint](samples/emit-extracted-items.md) — send each extracted item to an external endpoint.
- [Reshape the emitted body with a template](samples/emit-body-template.md) — reshape the emitted item with `body_template`.
- [Crawl every page and emit every item](samples/paginated-crawl-emit.md) — crawl every page and emit every item.

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
