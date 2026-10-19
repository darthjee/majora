# Plan: Client: first resource wrappers

Issue: [1609-client-first-resource-wrappers.md](../../issues/1609-client-first-resource-wrappers.md)

## Overview

Add the first resource wrappers (`games`, plus `npcs`, `pcs`, `factions`, `items` and `documents`
under `client.game(slug)`) to the client library, on top of the #1608 core. Each family declares
a variant map for its regular and restricted URLs.

See [client.md](client.md) for the full plan.
