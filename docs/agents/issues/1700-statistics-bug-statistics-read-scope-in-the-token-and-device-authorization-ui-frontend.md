# Issue: Statistics bug: statistics:read scope in the token and device-authorization UI (frontend)

## Description

Part of Epic #1696 (statistics session investigation). The backend adds the staff-only, read-only
`statistics:read` scope (#1699) and lets device-authorization requests ask for scopes (#1708). The
frontend must handle that scope in the scoped-token creation page, in the token badges and in the
device-authorization approval screen. Contract:
`docs/agents/specs/statistics-bug/export-endpoint.md#frontend-1700`.

## Problem

- `ApiTokenScopes.js` groups scope families through the UI-only `SCOPE_GROUPS` constant, and
  families missing from it are silently dropped. So `statistics:read` would not be shown even when
  `options.json` returns it.
- The scope picker assumes every family has both read and write, and "Select all read/write"
  applies to every family.
- The approval screen (`AuthorizationRequests`) is a plain "Authorize login request" confirmation
  that shows IP and browser only. It never shows scopes.

## Expected Behavior

A staff user creating a token sees a **Statistics** group with a single Read option, explained as
access to visitor statistics (IP addresses and visit history), and must select it on purpose.
Non-staff users never see it. When a device-authorization request asks for scopes, the approval
screen lists them and highlights `statistics:read`, so the user knows what they are approving.

## Solution

### Visibility

- The token page renders whatever `GET /account/api_tokens/options.json` returns. The backend
  already lists `statistics:read` only for staff (#1699).
- No client-side staff check is added and `AccessStore` is not called directly. If a permission
  check is ever needed, it goes through `RequestStore` / `RequestPermissionResolvers`.

### Scope picker

- Add a new `statistics` group with the `statistics` family to `SCOPE_GROUPS`, shown **last**.
- The family is read-only: only a Read checkbox, no Write checkbox. The picker and
  `groupScopes` handle a family whose action is missing from the catalogue.
- Help text: access to visitor statistics, including IP addresses and visit history.
- "Select all read" and "Select all write" do **not** include `statistics:read`.

### Badges

- The owner token list and the staff token panel (`StaffUserApiTokensHelper`) render
  `statistics:read` through the same group, with no other change.

### Approval screen

- Depends on #1708 for the data shape (the requested scopes, as catalogue values, on the
  authorization request).
- When a request asks for scopes, the authorize modal lists them with their catalogue labels (never
  raw client text) and highlights `statistics:read` with the IP addresses and visit history
  warning. The title reads "token request" instead of "login request".
- Requests without scopes keep today's modal.

### Translations

- `en` and `pt` under `frontend/assets/i18n/`: group and family labels, help text, the warning
  and the token-request title.

### Out of scope

- Backend changes (#1699, #1708).

### Testing

Jasmine specs:

- the Statistics group is shown when `options.json` returns `statistics:read` and hidden otherwise;
- the family has no Write checkbox and is excluded from "Select all read/write";
- the badges render `statistics:read`;
- the approval modal lists the requested scopes and the warning, and keeps today's content for
  requests without scopes.

### Responsible agents

`frontend`; `translator`

## Benefits

Staff can create the read-only token the investigation needs, and anyone approving a device request
sees clearly that it grants access to visitor IP addresses and visit history.
