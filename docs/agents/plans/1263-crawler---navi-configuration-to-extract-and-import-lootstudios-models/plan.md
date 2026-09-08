# Plan: Crawler — Navi configuration to extract and import Lootstudios models

Issue: [1263-crawler---navi-configuration-to-extract-and-import-lootstudios-models.md](../issues/1263-crawler---navi-configuration-to-extract-and-import-lootstudios-models.md)

## Overview

Add a Navi YAML config under `crawler/` that extracts the maintainer's owned
Lootstudios catalog (`GetMyLootsCache`) and emits it, as two independent
`parser`/`emit` passes over the same response, to two Majora import
endpoints: bundles to `POST /miniatures/collections/import.json` (#1281,
**not yet merged — blocks this plan's Step 01/02**) and miniatures to
`POST /miniatures/stl_models/import.json` (#1262, already merged). No
cross-item join is used or needed. Also fills in `crawler/RUNNING.md`'s
`TBD` placeholders once the config exists.

See [crawler.md](crawler.md) for the full plan.
