# Plan: Explore generating the i18n loader manifest to remove en/pt duplication

Issue: [1197-explore-generating-the-i18n-loader-manifest-to-remove-en-pt-duplication.md](../issues/1197-explore-generating-the-i18n-loader-manifest-to-remove-en-pt-duplication.md)

## Overview

Replace the hand-typed `chunkLoaders` object in `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js` (Codacy's 151-line clone pair) with a small `Proxy` that computes each namespace's lazy `?raw` import thunk on demand from the requested namespace name, instead of enumerating it by hand. `import.meta.glob` was considered and rejected (Node/Jasmine test-loader constraint, see the issue). `TranslationLoader.js`, `Translator.js`, and all spec files stay untouched.

See [translator.md](translator.md) for the full plan.

## Companion fix

Implementing the `translator.md` plan surfaced a regression in spec-support tooling: `frontend/specs/support/preloadTranslations.js` enumerated real chunk namespaces via `Object.keys(manifest.chunkLoaders)`, which no longer works once `chunkLoaders` is a `Proxy` with no real own keys for un-overridden namespaces. See [frontend.md](frontend.md) for the fix (filesystem-based namespace enumeration instead).
