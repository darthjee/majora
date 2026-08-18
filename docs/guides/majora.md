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

Every endpoint accepts either of the following, handled uniformly by
`CookieTokenAuthentication` (`backend/accounts/authentication.py`), which is the
DRF-wide default (`REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` in
`backend/majora_project/settings.py`):

- **API token header** (used by automated clients, e.g. the crawler): send
  `Authorization: Token <key>` on every request. This is the recommended path for
  non-browser clients.
- **Session cookie** (used by the web frontend): the browser session carries an
  `auth_token` value set at login, resolved server-side to the same token.

A resolved user is only treated as authenticated if their `UserProfile.status` is
`approved` — `pending`/`denied` users are treated as anonymous regardless of which
auth path resolved them.

**Obtaining a token today:** tokens are standard DRF authtoken rows
(`rest_framework.authtoken.models.Token`, already installed). Create/rotate a
service-account token for an automated client via the Django admin (`/admin/`) — no
dedicated tooling exists yet; see the "Explicitly out of scope" note in
[issue #1148](../agents/issues/1148-centralize-user-check--allow-api-token-requests-and-document-api.md)
for why.

## Available topic pages

- [Miniatures API](./majora/miniatures.md) — `collections`, `sources`, `stl_models`
  endpoints (the surface the crawler will consume first)

More topic pages will be added incrementally as other parts of the API are
documented for external consumers.
