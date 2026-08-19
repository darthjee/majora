# Plan: Refactor character-related components and specs flagged as too long (Lizard nloc-medium)

Issue: [1183-refactor-character-related-components-and-specs-flagged-as-too-long--lizard-nloc-medium.md](../../issues/1183-refactor-character-related-components-and-specs-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

All 9 flagged occurrences live under `frontend/`, entirely within the `frontend` agent's scope. Bring each method back under the 50-NLOC limit through sub-responsibility extraction — private hooks and small "modals" sub-components for the six page components, `#renderX` static-method extraction for the one pure-render helper, and local fixture/assertion builder functions for the two spec files.

See [frontend.md](frontend.md) for the full plan.
