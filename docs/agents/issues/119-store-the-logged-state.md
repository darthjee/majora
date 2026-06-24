# Issue: Store the Logged State

## Description
After a successful login, the user loses their logged-in state when the page is refreshed. The authentication token or session must be persisted across page reloads.

## Problem
- After login, a page refresh causes the user to lose the authenticated state
- There is currently no persistence mechanism for the login token or session

## Expected Behavior
- After login, the user remains authenticated across page refreshes and browser sessions

## Solution
Use Django's built-in session framework (`django.contrib.sessions`) to create a server-side session upon login and store only the session ID in an `HttpOnly`, `Secure`, `SameSite` cookie.

- The authentication token never leaves the server
- The session ID cookie is inaccessible to JavaScript (mitigates XSS)
- Sessions can be invalidated server-side (real logout)
- Django's session infrastructure is already available and battle-tested

### Implementation steps
1. Enable `django.contrib.sessions` and configure session storage (DB or cache)
2. On successful login, create a session and store the user token in it
3. Return the session ID via a secure cookie (`HttpOnly`, `Secure`, `SameSite=Lax`)
4. On subsequent requests, read the session ID from the cookie and retrieve the token from the session store
5. On logout, invalidate and delete the session server-side

## Benefits
- Users stay logged in after a page refresh without having to re-authenticate
- Token never travels in requests — only a short-lived session ID does
- Real server-side logout capability
- Standard, well-supported Django pattern

---
See issue for details: https://github.com/darthjee/majora/issues/119
