# Plan: Session detail response caches stale can_edit — migrate to dedicated /permissions.json endpoint

Issue: [591-add-missing-create-pool-button-in-session.md](../../issues/591-add-missing-create-pool-button-in-session.md)

## Overview

The "Create Pool" button on the session page can go missing for a legitimate DM because
`GameSessionDetailSerializer` embeds a per-user `can_edit` field in the cacheable
`/games/:slug/sessions/:id.json` response, so a cached response can leak a stale value across
users. `GameSession.can_be_edited_by(user)` already just delegates to
`self.game.can_be_edited_by(user)`, so — mirroring the existing precedent where sessions reuse
`GET /games/:slug/access.json` instead of having their own `access.json` — the fix is to drop
`can_edit` from the session detail serializer and have the frontend reuse the existing, already
never-cached `GET /games/:slug/permissions.json` endpoint (and its existing `AccessStore`
plumbing) instead of introducing any new backend endpoint.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Removed field**: `can_edit` is removed from the `GET /games/:game_slug/sessions/:id.json`
  response body (`GameSessionDetailSerializer`). No other fields change.
- **Reused endpoint** (already exists, unchanged): `GET /games/:game_slug/permissions.json` →
  `{"can_edit": <bool>}`, `X-Skip-Cache: true` unless a `?role=` query param is present (in
  which case `X-Force-Public-Cache: true`). Backend has no new work here — the frontend simply
  starts calling this existing endpoint (via the existing `GameClient.fetchGamePermissions` /
  `AccessStore.ensureGamePermissions`/`getGamePermissions` helpers already used by
  `GameController`) using the session's `game_slug`, which is already available from the route.
- Frontend must treat a not-yet-resolved permissions fetch as fail-closed (`can_edit: false`),
  consistent with `AccessStorePermissions`'s existing default — this is already how
  `AccessStore.getGamePermissions` behaves, no new default logic needed.
