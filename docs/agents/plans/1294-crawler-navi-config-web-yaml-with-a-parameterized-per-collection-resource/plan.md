# Plan: Crawler: navi_config.web.yaml with a parameterized per-collection resource

Issue: [1294-crawler-navi-config-web-yaml-with-a-parameterized-per-collection-resource.md](../../issues/1294-crawler-navi-config-web-yaml-with-a-parameterized-per-collection-resource.md)

## Overview

Add a new Navi entry file, `crawler/navi_config.web.yaml`, that `include`s
the existing headless `crawler/navi_config.yaml` unchanged and layers on the
`web:`/`workers:` wiring #1295's extension backend route and #1298's derived
image need — without declaring any `namespace:` key, so the per-enqueue
namespaces #1295 pushes at runtime can resolve the shared clients by bare
name.

See [crawler.md](crawler.md) for the full plan.
