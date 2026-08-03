# Plan: Remove periodic health check

Issue: [950-remove-periodic-health-check.md](../issues/950-remove-periodic-health-check.md)

## Overview

Remove the client-side health-check mechanism end to end, now that infra guarantees uptime and this polling is no longer needed. This touches both the backend (the `/health.json` endpoint and a middleware special-case) and the frontend (the polling loop, the UI status indicator, and an idle-tracking hook that existed solely to support the poll's idle-pause behavior).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

The only thing crossing the boundary is the retirement of the `/health.json` path itself: the backend agent removes the endpoint (it will 404 afterward) and the frontend agent removes every caller of it. There is no response shape or other data contract to preserve — this is a mutual removal, not a new integration. Neither side depends on the other's change landing first; both can proceed independently and the branch is only fully consistent once both are done.
