# Plan: Backend — standalone Collection upsert endpoint for crawler import (Lootstudios)

Issue: [1281-backend---standalone-collection-upsert-endpoint-for-crawler-import--lootstudios.md](../../issues/1281-backend---standalone-collection-upsert-endpoint-for-crawler-import--lootstudios.md)

## Overview

Add a new `POST /miniatures/collections/import.json` endpoint, mirroring the existing `POST /miniatures/stl_models/import.json` (#1262) contract, so the crawler can upsert a `Collection` as its own independent pass over a Lootstudios bundle — without requiring a sibling `StlModel` payload. This closes the gap where a bundle with zero currently-owned miniatures produces no `Collection` row at all, and relaxes `CollectionSync` so a `Collection` stub can be created from `external_id` alone.

See [backend.md](backend.md) for the full plan.
