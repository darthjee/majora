# Majora API Guide

## Overview

This guide documents the Majora JSON API for external/automated consumers (e.g. a
future STL-site crawler) that authenticate via an API token rather than a browser
session cookie. Unlike `docs/agents/`, which documents the codebase for the agents
that maintain it, this guide documents the *public request/response contract* of the
API itself.

All endpoints below are served by the Django backend and reached through the Tent
proxy at `*.json` paths (see [`docs/agents/architecture.md`](../agents/architecture.md)
for the overall request flow).

## Authentication

Every endpoint accepts one of the following:

- **Scoped API token** (recommended for automations): send
  `Authorization: Bearer mjr_<prefix>_<secret>` on every request. Tokens are created from the
  web UI (account menu → **API tokens**), carry `read`/`write` scopes per resource family and an
  optional list of games, and never grant more than their owner can do. They are handled by
  `ApiTokenAuthentication`, which runs first. An unknown, revoked, expired or malformed token
  always gets `401` `token_invalid`; a valid token that lacks a scope or game gets `403`. See the
  [client guide](client.md) for creating and using one, including the
  [`majora-client`](client.md#using-majora-client) package.
- **Legacy API token header** (used by the crawler): `Authorization: Token <key>`, a standard
  DRF authtoken row (`rest_framework.authtoken.models.Token`) with all of its user's access and
  no scopes. It is created for a service account through the Django admin (`/admin/`); there
  is no other tooling for it (see issue #1148).
- **Session cookie** (used by the web frontend): the browser session carries an `auth_token`
  value set at login. The legacy header and the cookie are both handled by
  `CookieTokenAuthentication` (`backend/accounts/authentication.py`).

A resolved user is only treated as authenticated if their `UserProfile.status` is
`approved`. With the legacy header or the cookie, `pending`/`denied` users are treated as
anonymous; a scoped token whose owner is not approved gets `401`.

## Available topic pages

- [Miniatures API](./majora/miniatures.md) — `collections`, `sources`, `stl_models`
  endpoints (the surface the crawler will consume first)
- [Client guide](./client.md) — scoped API tokens and the `majora-client` library and CLI

More topic pages will be added incrementally as other parts of the API are
documented for external consumers.
