# Plan: Add Healthcheck

Issue: [193-add-healthcheck.md](../issues/193-add-healthcheck.md)

## Overview

Add a lightweight `GET /health.json` endpoint to the Django backend that returns
`{"status": "ok"}` with HTTP 200 and no authentication requirement. The frontend
Header component is updated to poll this endpoint every 30 seconds for the lifetime
of the page session.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**Endpoint:** `GET /health.json`

**Response:**
- HTTP status: `200 OK`
- Content-Type: `application/json`
- Body: `{"status": "ok"}`

**Authentication:** none (public endpoint, `AllowAny` permission, no token required)

**Polling interval:** 30 000 ms (30 seconds)
