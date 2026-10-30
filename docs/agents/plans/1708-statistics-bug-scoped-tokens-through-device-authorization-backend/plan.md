# Plan: Statistics bug: scoped tokens through device authorization (backend)

Issue: [1708-statistics-bug-scoped-tokens-through-device-authorization-backend.md](../../issues/1708-statistics-bug-scoped-tokens-through-device-authorization-backend.md)

## Overview

Let a device-authorization request ask for scopes, validated against the scope catalogue, and
make polling an approved scoped request issue a 24-hour `mjr_` scoped `ApiToken` instead of a
legacy `Token` and session. Requests without scopes are unchanged.

See [backend.md](backend.md) for the full plan.
