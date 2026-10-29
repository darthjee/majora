# Plan: Statistics bug: statistics:read scope in the token and device-authorization UI (frontend)

Issue: [1700-statistics-bug-statistics-read-scope-in-the-token-and-device-authorization-ui-frontend.md](../../issues/1700-statistics-bug-statistics-read-scope-in-the-token-and-device-authorization-ui-frontend.md)

## Overview

Show the staff-only, read-only `statistics:read` scope in the token create form, in the token
badges and on the device-authorization approval screen. The frontend renders whatever
`options.json` returns (the backend filters it by staff, #1699), adds a read-only **Statistics**
group shown last and kept out of "Select all", and lists the requested scopes on the approval
modal once #1708 provides them. The translator adds the `en` / `pt` keys.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **Scope string:** `statistics:read` (family `statistics`, no `write` action).
- **UI group:** `statistics` containing the family `statistics`, last in `SCOPE_GROUPS`.
- **Authorization request data (#1708):** the request object gets `scopes: Array<string>` of catalogue
  values (empty or absent for a plain login request).
- **Translation keys** (`en` and `pt`):
  - `api_tokens_page.group_statistics` — "Statistics"
  - `api_tokens_page.family_statistics` — "Visitor statistics"
  - `api_tokens_page.family_statistics_help` — "Access statistics, including visitor IP addresses
    and visit history. Staff only."
  - `authorization_requests_page.authorize_token_modal_title` — "Authorize token request"
  - `authorization_requests_page.authorize_token_modal_body` — "This device asks for a token with
    the permissions below. Make sure the device and location below are your own."
  - `authorization_requests_page.scopes_label` — "Requested permissions"
  - `authorization_requests_page.statistics_warning` — "This grants access to visitor IP
    addresses and visit history."

  Follow the existing naming in the files if the group label key already has a different pattern
  (e.g. `group_<name>`); the frontend uses whatever the translator commits.
