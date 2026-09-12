# Plan: Backend: miniatures import endpoints return 200 on create as well as update

Issue: [1297-backend-miniatures-import-endpoints-return-200-on-create-as-well-as-update.md](../../issues/1297-backend-miniatures-import-endpoints-return-200-on-create-as-well-as-update.md)

## Overview

Both crawler-import views (`collection_import`, `stl_model_import`) return 201 on
create today, which Navi's single-integer `emit.status` (fixed at 200) reads as a
failed emit. Make both views always return 200, and update their tests accordingly.

See [backend.md](backend.md) for the full plan.
