# Plan: Client: document page wrappers

Issue: [1621-client-document-page-wrappers.md](../../issues/1621-client-document-page-wrappers.md)

## Overview

Add a `DocumentPages` wrapper to the client library, reached through
`client.game(slug).documents.pages(documentId)`. It supports `list` (+ `iterate`), `create`,
`update`, `trim(keep)` and `bumpVersion(data)`, each with a regular and a restricted (`all.json`)
variant. The work is client-only (no backend, no CLI changes).

See [client.md](client.md) for the full plan.
