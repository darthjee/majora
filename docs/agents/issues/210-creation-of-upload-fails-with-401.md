# Issue: Creation of upload fails with 401

## Description
`POST /games/:game_id/photo_upload.json` returns 401 Unauthorized even when the request includes a valid `Authorization: Token <key>` header and the requesting user is both a game master (DM) and a superuser.

## Problem
The `photo_upload` view is decorated with `@authentication_classes([TokenAuthentication])`, which relies exclusively on the `Authorization: Token` header reaching the Django backend. However, the Tent proxy's default backend rule (which forwards all `.json` requests to `http://backend:8080`) appears not to forward the `Authorization` header, so Django's `TokenAuthentication` finds no credentials and responds with 401.

This is the same class of problem addressed in issue #184 for access endpoints, where `CookieTokenAuthentication` was introduced to fall back to session-cookie authentication when the token header is stripped by the proxy. The `photo_upload` view was not updated in that fix.

## Expected Behavior
A user who is authenticated (DM or superuser) and sends a valid `Authorization: Token` header should receive a `201 Created` response from `POST /games/:game_id/photo_upload.json` containing the upload ID and token.

## Solution
Switch the `photo_upload` view (`source/games/views/photo_upload.py`) to use `CookieTokenAuthentication` instead of the standard `TokenAuthentication`. `CookieTokenAuthentication` tries the `Authorization` header first and falls back to the session cookie, matching the pattern used by the access endpoints after fix #184.

---

Tags: :shipit:
