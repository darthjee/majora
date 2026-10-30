## Description

Part of Epic #1696 (statistics session investigation). Split out of #1699. The `analyse.py`
investigation script gets its token through the device-authorization flow, but today that flow
issues a legacy DRF `Token` and a browser session (`_issue_login_credentials` in
`backend/accounts/views/authorization_requests/poll.py`) with full staff powers, including the
`DELETE staff/statistics.json` clear. This defeats the read-only design of `statistics:read`.
Extend the flow so that an authorization request can ask for scopes and yields a scoped `mjr_`
`ApiToken`. The contract is in `docs/agents/specs/statistics-bug/export-endpoint.md#device-authorization`.

## Solution

- **Scopes on the request:** `AuthorizationRequest` stores the requested scopes (migration,
  `JSONField`, default empty list).
- **Creation validation** (`users/authorization_requests.json`, unauthenticated, so this is the
  only guard): `scopes` is optional.
  - Missing or an empty list: a plain login request, today's behaviour.
  - Otherwise it must be a list of known catalogue values (`backend/accounts/scopes.py`,
    `family:action`), with no duplicates and no more entries than the catalogue size. Anything
    else (not a list, unknown value, duplicate, too many) is a `400`.
- **List / approval data:** the authorization request list returns `scopes` (the stored,
  validated catalogue values; never raw client text). The #1700 approval screen already reads
  this field and renders translated labels.
- **Approval:** approving a request that asks for `statistics:read` as a non-staff user returns
  `400` `{"errors": {"scopes": ["scope_staff_only"]}}` (the same code #1699 uses for token
  creation). The request stays `open`, so the user can still deny it.
- **Polling:** an approved request that asked for scopes issues an `mjr_` scoped `ApiToken`
  (`ApiToken.objects.create_token`) with exactly those scopes:
  - name `Device authorization <YYYY-MM-DD> — <browser>`, truncated to 255 characters
    (renamable later from the token list);
  - `expires_at` fixed at **24 hours** after issuing;
  - no per-game restriction;
  - it never issues a legacy `Token`, never sets the browser session and never attaches a
    statistics session.

  The response keeps today's shape: `202 {"status": "approved", "token": "mjr_…"}`. The raw
  token is returned once and never stored (only its hash, as for every `ApiToken`).
- **Backward compatible:** requests without scopes keep today's behaviour (legacy token,
  session, statistics session).
- **Docs:** update `docs/agents/access-control/api-token.md` and `token-scopes.md` with the
  scoped device flow, and mark the Device authorization section of
  `docs/agents/specs/statistics-bug/export-endpoint.md` as implemented.

## Depends on

#1699 (the `statistics:read` scope and the `scope_staff_only` code) — merged.

## Out of scope

The frontend approval screen (#1700, merged); a requester-chosen expiry (could be added later
for the automation client, #1592).

## Testing

Backend tests for:

- creation with valid scopes, without scopes, with an empty list, and with an unknown value,
  a duplicate, too many entries or a non-list (`400`);
- the list returning `scopes`;
- approval of a `statistics:read` request by staff (ok) and by non-staff (`400`
  `scope_staff_only`, request still `open`);
- polling a scoped request: `mjr_` token with exactly the requested scopes, the 24-hour expiry,
  the name, no game restriction, and no legacy `Token`, session or statistics session created;
- requests without scopes are unchanged.

## Responsible agents

backend; data-access and security (review)
