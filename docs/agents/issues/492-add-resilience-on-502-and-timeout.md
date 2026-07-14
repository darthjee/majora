# Issue: Add resilience on 502 and timeout

## Description
Because of how the server is deployed, the first request(s) after a period of inactivity commonly fail with either a `502` response or a client-side timeout while the backend is still booting up. Frontend clients currently give up immediately on these errors instead of waiting for the backend to become available, so the user sees a broken/error state on what is really just a transient cold-start condition.

## Problem
All HTTP requests in the frontend go through `BaseClient#request` (`frontend/assets/js/client/BaseClient.js`), which every resource client (`GameClient`, `CharacterClient`, `AuthClient`, etc.) extends. This method performs a single `fetch` call with no retry: a `502` or an `AbortSignal.timeout` rejection propagates straight to the caller, which surfaces it as an error.

There is already piecemeal poll-until-ready logic elsewhere in the codebase (`RecoverPasswordController#waitUntilReady`/`#checkReady`/`#wait` and `HeaderController#startHealthCheck`), but it is private to those controllers, not reusable, and not applied to ordinary data-fetching clients.

## Expected Behavior
- GET (idempotent) requests that fail with a `502` response or a timeout are retried automatically and indefinitely, until they succeed — the caller’s promise only resolves/rejects based on the final outcome, not the individual failed attempts.
- Non-idempotent requests (POST/PATCH/PUT/DELETE) are **not** retried by this mechanism; they fail as they do today, to avoid duplicate writes.
- A status indicator is shown in the header, to the right of the language selector, reflecting the resilience layer’s current state:
  - **Idle** (no request in flight, nothing failing): green, Bootstrap icon `lightning-charge`, alt text "idle".
  - **Requesting** (a request currently in flight): yellow, Bootstrap icon `lightning-charge-fill`, alt text "requesting".
  - **Retrying** (the most recent attempt failed with a 502 or timeout and is being retried): red, Bootstrap icon `hourglass-split`, alt text "retrying".

## Solution
- Extract a reusable class (e.g. a `ResilientRequest`/similar wrapper) that owns retrying a single logical request: it produces and controls its own promise, retrying on `502`/timeout and only settling that promise once the request finally succeeds.
- Wire this into `BaseClient#request` (or a thin layer around it) so every client that extends `BaseClient` gets the behavior automatically for GET requests, without each resource client having to implement retry logic itself.
- Generalize/replace the ad-hoc retry loop in `RecoverPasswordController#waitUntilReady` to reuse the new class instead of duplicating the pattern.
- Expose the current global state (idle / requesting / retrying) from this layer (e.g. via a small subscribable store), so a new header component can render the indicator described above regardless of which page or client triggered the request. This indicator is visible to all users, not just superusers (unlike the existing `.server-status` dot, which is superuser-only).

## Benefits
- Transient backend cold-start errors become invisible to the end user instead of surfacing as broken pages.
- Centralizes retry/poll-until-ready logic in one place instead of duplicating it across controllers.
- Visible header feedback reassures the user that the app is actively retrying rather than appearing frozen or broken.
