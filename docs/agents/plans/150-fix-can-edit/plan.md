# Plan: Fix Can Edit

Issue: [150-fix-can-edit.md](../issues/150-fix-can-edit.md)

## Overview

The proxy caches the first response to character access endpoints, often serving a stale `can_edit=false` to authenticated users (DMs and character owners) because the frontend never sends `X-Skip-Cache: 1` on those requests. The fix adds that header in `CharacterClient` for `fetchPcAccess` and `fetchNpcAccess`. A backend regression test is also added for the untested "user is both DM and character owner" scenario.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

None. The two agents work independently:
- The backend adds a test only — no change to the API surface or response shape.
- The frontend adds a request header — no new endpoint or payload change.
