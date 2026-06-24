# Infra Plan: Add Character Hidden Description

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **consumes**:
- Two new backend endpoints (produced by the backend agent):
  - `GET /games/{:slug}/pcs/{:id}/full.json`
  - `GET /games/{:slug}/npcs/{:id}/full.json`

These endpoints require an auth token and return 403 for non-editors; the Navi cache warmer does **not** hold credentials, so it should not attempt to warm these endpoints. No Navi changes are needed unless anonymous access is later added.

## Implementation Steps

### Step 1 — Review Navi config for applicability

The new `/full` endpoints are access-gated (403 for any unauthenticated request). Navi warms the cache anonymously, so warming these endpoints would always result in 403 responses — not useful and potentially noisy.

**Decision**: do not add the `/full` endpoints to `.circleci/navi_config.yaml`. This is intentional and correct given the auth requirement.

### Step 2 — Verify existing entries are unaffected

Confirm that the rename of `description` → `public_description` has no impact on Navi config (Navi only caches URLs, it does not parse response bodies for field names beyond `game_slug` and `id` for pagination). No changes required.

## Files to Change

No files need to change for this issue. Document the decision in this plan so it is not revisited during review.

## Notes

- If a future issue adds anonymous-readable private descriptions (unlikely), the `/full` endpoints should be added to Navi at that point.
- The existing `pc` and `npc` resources in `navi_config.yaml` are unaffected by the field rename.
