# Plan: Refactor common_item/document/game/staff_user/stl_model/treasure components flagged as too long (Lizard nloc-medium)

Issue: [1184-refactor-common-item-document-game-staff-user-stl-model-treasure-components-flagged-as-too-long--lizard-nloc-medium.md](../../issues/1184-refactor-common-item-document-game-staff-user-stl-model-treasure-components-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

Pure refactor, no behavior change: bring 8 Lizard-flagged methods (across 8 files) back under the 50-NLOC limit through sub-responsibility extraction. Single-agent work, entirely inside `frontend/`.

See [frontend.md](frontend.md) for the full plan.
