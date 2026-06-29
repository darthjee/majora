# Add Healthcheck

## Context

The application needs a lightweight health check endpoint so that the frontend can
periodically verify connectivity to the backend and alert the user (or take action) when
the server is unreachable. This also serves as a wakeup ping to keep the backend warm.

## What needs to be done

**Backend:** Add a new route `/health.json` that returns HTTP 200 with the body
`{"status": "ok"}`. No authentication should be required for this endpoint.

**Frontend:** The header component should call `/health.json` every 30 seconds to confirm
that the backend is alive. If the check fails the UI may surface an offline indicator
(exact UX to be determined during implementation).

## Acceptance criteria

- [ ] `GET /health.json` returns HTTP 200 with `{"status": "ok"}`
- [ ] The endpoint is publicly accessible (no authentication required)
- [ ] The header component polls `/health.json` every 30 seconds
- [ ] The polling is active for the lifetime of the page session
