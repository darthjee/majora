# Fix Logoff

## Context

The logout endpoint at `POST /users/logout.json` is returning HTTP 401 (Unauthorized) instead of successfully revoking the user's token and returning 204. The response includes `www-authenticate: Token`, indicating the TokenAuthentication layer is rejecting the request even though a valid token is provided in the `Authorization` header. Additionally, the endpoint uses the POST method but should use DELETE to be semantically correct for a resource-destruction operation.

## What needs to be done

**Backend:** Investigate why the logout endpoint at `source/games/views/auth.py` returns 401 for authenticated requests. Change the `@api_view` decorator at line 117 from `['POST']` to `['DELETE']`. Ensure `@permission_classes([IsAuthenticated])` is applied correctly so that a valid token allows access and the token is revoked on success, returning 204.

**Frontend:** Update the logout API call to use the DELETE HTTP method instead of POST.

## Acceptance criteria

- [ ] A DELETE request to `/users/logout.json` with a valid `Authorization: Token <token>` header returns 204 and revokes the token
- [ ] A POST request to `/users/logout.json` is rejected (405 Method Not Allowed)
- [ ] The frontend sends DELETE (not POST) when logging out

Tags: :shipit:
