# Symptom

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

## New `Session` vs. new `Visit`

- A **new `Visit`** is expected: it opens when the session's latest visit has been inactive for
  longer than `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS` (default 30 minutes).
- A **new `Session`** for a visitor that already has one is the suspected bug. A `Session` is the
  visitor (device/browser) identity, so a duplicate inflates unique visitors and splits a
  visitor's history.

The first task of the investigation is to confirm that the observed symptom is a new `Session`
row, not a new `Visit`.

## How sessions are reused today

See [Access Statistics](../../statistics.md#data-model) for the full model.

1. The signed `majora_statistics` cookie carries the session token. The middleware looks the
   `Session` up by token and domain.
2. The session is reused only when `session.ip` and `session.domain_id` match the current
   request. Otherwise a new `Session` row is created and a new cookie is set.
3. After the view runs, `_backfill_user` handles a logged-in user:
   - a session created in this same request gets the user attached **in place**;
   - a pre-existing anonymous session is always **rotated** to a new user-tied `Session`
     (login is a visit boundary).

Each branch that creates a row records a
[creation reason](tracking-columns.md#creation-reasons) (*planned by #1712*):

| Branch | `creation_reason` |
|---|---|
| No cookie | `no_cookie` |
| Cookie fails to unsign | `invalid_cookie` |
| Valid token, no matching row | `cookie_session_not_found` |
| Session exists for another domain | `domain_changed` |
| Session exists, IP differs | `ip_changed` |
| Rotation in `_backfill_user` | `login_rotation` |

The in-place attach creates no row: it only sets `first_seen_logged` on the session created in
the same request.

## Legitimate new sessions

These create a new `Session` by design. `analyse.py` reports them separately and they do not
count as the bug:

- another browser or device (`no_cookie`);
- a private window (`no_cookie`);
- cleared cookies (`no_cookie`);
- logout (the view deletes the cookie; `no_cookie` on the next request);
- a real IP change of the client (`ip_changed`);
- bots that never keep cookies (`no_cookie`);
- cookies pointing to sessions removed by a statistics Clear, #1684
  (`cookie_session_not_found`).

The reason in parentheses is the one each case is expected to record once the
[tracking columns](tracking-columns.md) exist.

## Background

- [Login is a visit boundary](../../statistics.md#visit-is-the-activity)
- [Tracking race](../../statistics.md#tracking-race) (#1683)
- [Client IP integrity](../../statistics.md#client-ip-integrity)
