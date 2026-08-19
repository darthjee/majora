# Plan: Refactor shared spec helpers and test-loader support flagged as too long (Lizard nloc-medium)

Issue: [1185_refactor_shared_spec_helpers_and_test_loader_support_flagged_as_too_long__lizard_nloc_medium.md](../../issues/1185-refactor-shared-spec-helpers-and-test-loader-support-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

Entirely a `frontend` task. Fixes 4 Codacy `lizard` NLOC violations across 3 files by converting `AppHelperSpec.js` and `HashRouteResolverSpec.js` into data-driven, per-domain `*Spec.js` folders (mirroring the repo's existing `HeaderHelper/` split precedent), and decomposing `jsx-loader.mjs`'s `load()` into 6 named handler functions. No production code or behavior changes.

See [frontend.md](frontend.md) for the full plan.
