# Plan: Fix Logoff

Issue: [201-fix-logoff.md](../issues/201-fix-logoff.md)

## Overview

The logout endpoint at `/users/logout.json` currently accepts `POST` but should accept `DELETE` to follow REST conventions for resource-destruction operations. Both the backend view and the frontend API client must be updated together. No proxy changes are needed.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**Endpoint:** `DELETE /users/logout.json`
- **Request:** `Authorization: Token <token>` header (required)
- **Success response:** `204 No Content` — token is deleted, session is flushed
- **Unauthenticated response:** `401 Unauthorized`
- **Wrong method (POST):** `405 Method Not Allowed`
