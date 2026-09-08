# Plan: Backend — dedicated crawler-import endpoint for Source/Collection/StlModel

Issue: [1262-backend---dedicated-crawler-import-endpoint-for-source-collection-stlmodel.md](../issues/1262-backend---dedicated-crawler-import-endpoint-for-source-collection-stlmodel.md)

## Overview

Add a single-item `POST /miniatures/stl_models/import.json` endpoint that upserts an
`StlModel` (keyed by `external_id` then `url`), find-or-creates its `Source` (by `name`) and
`Collection` (by `external_id` then `name`, globally, reassigning `source` to whichever
`Source` was resolved), and attaches a `lootstudio`-typed link back to the source URL. This is
entirely backend work, so there is a single owner.

See [backend.md](backend.md) for the full plan.
