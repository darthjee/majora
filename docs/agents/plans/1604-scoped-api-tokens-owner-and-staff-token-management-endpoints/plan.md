# Plan: Scoped API tokens: owner and staff token management endpoints

Issue: [1604-scoped-api-tokens-owner-and-staff-token-management-endpoints.md](../../issues/1604-scoped-api-tokens-owner-and-staff-token-management-endpoints.md)

## Overview

Add the 5 session-only owner endpoints under `account/api_tokens*` and the 2 staff endpoints under `staff/users/<id>/api-tokens*`, following [`token-api.md`](../../specs/client/token-api.md). Also add the `require_session` guard, the reachable-games helper and the access-control docs. The Bearer cache isolation (proxy and backend middleware) is out of scope and moved to #1643.

See [backend.md](backend.md) for the full plan.
